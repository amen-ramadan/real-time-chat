import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Inject,
  forwardRef,
  InternalServerErrorException, // Import InternalServerErrorException
  Logger, // Import Logger
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument } from './schemas/user.schema/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtService } from '@nestjs/jwt';
import { SocketGateway } from 'src/socket/socket.gateway';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name); // Initialize logger

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
    @Inject(forwardRef(() => SocketGateway)) private socketGateway: SocketGateway,
  ) {}

  async register(createUserDto: CreateUserDto) {
    const { email, password, confirmPassword, firstName, lastName } =
      createUserDto;
    this.logger.log(`Registration attempt for email: ${email}`);

    try {
      this.logger.debug(`Checking if user exists: ${email}`);
      const existingUser = await this.userModel.findOne({ email }).exec();
      if (existingUser) {
        this.logger.warn(`User already exists: ${email}`);
        throw new BadRequestException('User already exists');
      }

      if (password !== confirmPassword) {
        this.logger.warn(`Passwords do not match for: ${email}`);
        throw new BadRequestException("Passwords don't match");
      }

      this.logger.debug(`Hashing password for: ${email}`);
      const hashedPassword = await bcrypt.hash(password, 12);

      const defaultPictureHost = process.env.hostname || 'localhost';
      const defaultPicturePort = process.env.PORT || '3003';
      const defaultPicture = `http://${defaultPictureHost}:${defaultPicturePort}/uploads/default-picture.jpg`;
      this.logger.log(`Default picture URL for ${email}: ${defaultPicture}`);

      this.logger.debug(`Creating user in DB for: ${email}`);
      const createdUser = await this.userModel.create({
        email,
        firstName,
        lastName,
        password: hashedPassword,
        profilePicture: defaultPicture,
      });
      this.logger.log(`User created successfully for ${email} with ID: ${createdUser._id}`);

      const payload = { sub: createdUser._id.toString() }; // Ensure sub is string
      const accessToken = this.jwtService.sign(payload);

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _password, ...userWithoutPassword } =
        createdUser.toObject();

      try {
        this.logger.debug(`Emitting user_created event for ${email}`);
        this.socketGateway.emitUserCreated(createdUser);
      } catch (socketError) {
        this.logger.error(`Error emitting user_created via socket for ${email}:`, socketError);
        // Decide if this non-critical error should affect the registration success response
      }

      return {
        message: 'User registered successfully',
        user: userWithoutPassword,
        accessToken,
      };
    } catch (error) {
      this.logger.error(`Error during user registration for ${email}:`, error.stack);
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(`User registration failed due to an unexpected error.`);
    }
  }

  async login(email: string, loginPassword // Renamed to avoid conflict with user.password
    : string) {
    this.logger.log(`Login attempt for email: ${email}`);
    try {
      const user = await this.userModel.findOne({ email }).exec();
      if (!user) {
        this.logger.warn(`Login failed: User not found for email ${email}`);
        throw new BadRequestException('Invalid credentials'); // More generic for login
      }

      this.logger.debug(`Comparing password for user: ${email}`);
      const isPasswordValid = await bcrypt.compare(loginPassword, user.password);
      if (!isPasswordValid) {
        this.logger.warn(`Login failed: Invalid password for email ${email}`);
        throw new BadRequestException('Invalid credentials'); // More generic for login
      }

      this.logger.log(`User ${email} logged in successfully.`);
      const payload = { sub: user._id.toString() }; // Ensure sub is string
      const accessToken = this.jwtService.sign(payload);

      const { password: _, ...userWithoutPassword } = user.toObject();
      return {
        message: 'User logged in successfully',
        user: userWithoutPassword,
        accessToken,
      };
    } catch (error) {
      this.logger.error(`Error during user login for ${email}:`, error.stack);
      if (error instanceof BadRequestException) {
        throw error; // Re-throw known HTTP exceptions
      }
      // For other errors, throw a generic server error
      throw new InternalServerErrorException('Login failed due to an unexpected error.');
    }
  }

  async getUsers(userId: string) {
    this.logger.log(`Fetching users, excluding user ID: ${userId}`);
    try {
      const users = await this.userModel
        .find({ _id: { $ne: userId } })
        .select('-password')
        .exec();
      this.logger.log(`Found ${users.length} users.`);
      return users;
    } catch (error) {
      this.logger.error(`Error fetching users (excluding ${userId}):`, error.stack);
      throw new InternalServerErrorException('Failed to fetch users.');
    }
  }

  async updateUser(
    userId: string,
    updateData: { firstName?: string; lastName?: string; status?: string },
  ) {
    this.logger.log(`Updating user ID: ${userId} with data:`, updateData);
    try {
      const updatedUser = await this.userModel.findByIdAndUpdate(
        userId,
        {
          firstName: updateData.firstName,
          lastName: updateData.lastName,
          status: updateData.status,
        },
        { new: true },
      ).exec();

      if (!updatedUser) {
        this.logger.warn(`Update failed: User not found with ID ${userId}`);
        throw new NotFoundException('User not found');
      }

      this.logger.log(`User ${userId} updated successfully.`);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...userWithoutPassword } = updatedUser.toObject(); // updatedUser can't be null here

      try {
        this.logger.debug(`Emitting user_updated event for ${userId}`);
        this.socketGateway.emitUserUpdated(userWithoutPassword);
      } catch (socketError) {
        this.logger.error(`Error emitting user_updated via socket for ${userId}:`, socketError);
      }

      return userWithoutPassword; // Return without password
    } catch (error) {
      this.logger.error(`Error updating user ${userId}:`, error.stack);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to update user.');
    }
  }

  async updateProfilePicture(userId: string, file: Express.Multer.File) {
    this.logger.log(`Updating profile picture for user ID: ${userId}`);
    if (!file) {
      this.logger.warn(`Update profile picture failed: No file uploaded for user ${userId}`);
      throw new BadRequestException('No file uploaded');
    }

    const defaultPictureHost = process.env.hostname || 'localhost';
    const defaultPicturePort = process.env.PORT || '3003';
    const profilePictureUrl = `http://${defaultPictureHost}:${defaultPicturePort}/uploads/${file.filename}`;
    this.logger.log(`New profile picture URL for ${userId}: ${profilePictureUrl}`);

    try {
      const user = await this.userModel.findByIdAndUpdate(
        userId,
        { profilePicture: profilePictureUrl },
        { new: true },
      ).exec();

      if (!user) {
        this.logger.warn(`Update profile picture failed: User not found with ID ${userId}`);
        throw new NotFoundException('User not found');
      }

      this.logger.log(`Profile picture updated successfully for user ${userId}.`);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...userWithoutPassword } = user.toObject();

      try {
        this.logger.debug(`Emitting user_updated event for profile picture change for ${userId}`);
        this.socketGateway.emitUserUpdated(userWithoutPassword);
      } catch (socketError) {
        this.logger.error(`Error emitting user_updated (profile pic) via socket for ${userId}:`, socketError);
      }

      return userWithoutPassword;
    } catch (error) {
      this.logger.error(`Error updating profile picture for user ${userId}:`, error.stack);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to update profile picture.');
    }
  }
}
