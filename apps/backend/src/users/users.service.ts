import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Inject,
  forwardRef,
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
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
    @Inject(forwardRef(() => SocketGateway)) private socketGateway: SocketGateway,
  ) {}

  async register(createUserDto: CreateUserDto) {
    const { email, password, confirmPassword, firstName, lastName } =
      createUserDto;

    const existingUser = await this.userModel.findOne({ email });
    if (existingUser) {
      throw new BadRequestException('User already exists');
    }

    if (password !== confirmPassword) {
      throw new BadRequestException("Passwords don't match");
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const defaultPicture = `http://${process.env.hostname}:${process.env.PORT}/uploads/default-picture.jpg`;

    const createdUser = await this.userModel.create({
      email,
      firstName,
      lastName,
      password: hashedPassword,
      profilePicture: defaultPicture,
    });

    const payload = { sub: createdUser._id };
    const accessToken = this.jwtService.sign(payload);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _password, ...userWithoutPassword } =
      createdUser.toObject();

    this.socketGateway.emitUserCreated(createdUser);

    return {
      message: 'User registered successfully',
      user: userWithoutPassword,
      accessToken,
    };
  }

  async login(email: string, password: string) {
    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new BadRequestException('Invalid password');
    }

    const payload = { sub: user._id };
    const accessToken = this.jwtService.sign(payload);

    const { password: _, ...userWithoutPassword } = user.toObject();
    return {
      message: 'User logged in successfully',
      user: userWithoutPassword,
      accessToken,
    };
  }

  async getUsers(userId: string) {
    return this.userModel
      .find({ _id: { $ne: userId } })
      .select('-password')
      .exec();
  }

  async updateUser(
    userId: string,
    updateData: { firstName?: string; lastName?: string; status?: string },
  ) {
    const updatedUser = await this.userModel.findByIdAndUpdate(
      userId,
      {
        firstName: updateData.firstName,
        lastName: updateData.lastName,
        status: updateData.status,
      },
      { new: true },
    );

    // إزالة كلمة المرور من البيانات المرجعة
    if (updatedUser) {
      const { password, ...userWithoutPassword } = updatedUser;
      this.socketGateway.emitUserUpdated(userWithoutPassword); // إرسال الحدث إلى الجميع
    }

    return updatedUser;
  }

  async updateProfilePicture(userId: string, file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const profilePicture = `http://${process.env.hostname}:${process.env.PORT}/uploads/${file.filename}`;

    const user = await this.userModel.findByIdAndUpdate(
      userId,
      { profilePicture },
      { new: true },
    );

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { password, ...userWithoutPassword } = user.toObject();

    this.socketGateway.emitUserUpdated(userWithoutPassword);

    return userWithoutPassword;
  }
}
