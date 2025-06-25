import { io, Socket } from 'socket.io-client';
import { Store } from './globalState'; // Assuming globalState manages the access token and socket instance

const URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3003';

let socket: Socket | null = null;

export const initSocket = () => {
  const accessToken = Store.getState().accessToken;

  if (socket || !accessToken) {
    if (!accessToken) console.error('Socket connection: No access token found.');
    return socket;
  }

  console.log('Attempting to connect to WebSocket server...');
  socket = io(URL, {
    auth: {
      token: accessToken,
    },
    // You might need to configure transports if you have specific requirements
    // transports: ['websocket', 'polling'],
  });

  Store.getState().setSocket(socket); // Save socket instance to global state

  socket.on('connect', () => {
    console.log('Socket connected:', socket?.id);
    // Potentially request initial data or confirm connection
  });

  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
    Store.getState().setSocket(null); // Clear socket instance from global state
    socket = null; // Reset local socket variable
    // Handle reconnection logic if needed
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error.message, error.data);
    // Potentially display an error to the user or attempt reconnection with backoff
  });

  // Listen for messages from the server
  socket.on('receive_message', (message) => {
    console.log('Received message:', message);
    Store.getState().addMessage(message);
    // Potentially also update the 'seen' status or trigger notifications
  });

  // Listen for user updates (e.g., status changes, profile picture updates)
  socket.on('user_updated', (user) => {
    console.log('User updated:', user);
    Store.getState().updateFriend(user); // Assuming updateFriend can handle current user or friend updates
    // If it's the current user, update the user in the store as well
    if (Store.getState().user?._id === user._id) {
      Store.getState().setUser(user);
    }
  });

  // Listen for new users being created (optional, based on backend emitUserCreated)
  socket.on('user_created', (newUser) => {
    console.log('New user created and received via socket:', newUser);
    Store.getState().addFriend(newUser); // Add to a list of users/friends
  });

  // Listen for typing indicators
  socket.on('typing', (userId) => {
    // console.log('User typing:', userId);
    Store.getState().setTyping(userId);
  });

  socket.on('stop_typing', (userId) => {
    // console.log('User stopped typing:', userId);
    if (Store.getState().typing === userId) {
      Store.getState().setTyping(null);
    }
  });

  // Listen for message seen status updates
  socket.on('seen', (senderId) => {
    console.log('Messages seen by sender:', senderId);
    // This event indicates that messages sent BY THE CURRENT USER to senderId have been seen.
    // Or, it might mean messages sent BY senderId TO THE CURRENT USER have been seen by the current user.
    // The backend logic for `emit('seen', senderId)` in `handleSeen` needs to be clear.
    // Assuming it means messages *from* senderId *to current user* are now marked as seen by current user.
    // If so, we might need to update the message state in the store if we track 'seen' status per message.
    // For now, just logging.
  });

  return socket;
};

export const getSocket = () => {
  if (!socket) {
    // This could happen if getSocket is called before initSocket or after a disconnect
    // console.warn('Socket not initialized or disconnected. Attempting to initialize.');
    // return initSocket(); // Optionally try to re-initialize
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    console.log('Disconnecting socket...');
    socket.disconnect();
  }
};

// Example functions to emit events (to be called from components)
export const sendMessage = (receiverId: string, content: string) => {
  const s = getSocket();
  if (s) {
    s.emit('send_message', { receiverId, content });
  } else {
    console.error('Cannot send message, socket not connected.');
  }
};

export const sendTyping = (receiverId: string) => {
  const s = getSocket();
  if (s) {
    s.emit('typing', receiverId);
  }
};

export const sendStopTyping = (receiverId: string) => {
  const s = getSocket();
  if (s) {
    s.emit('stop_typing', receiverId);
  }
};

export const sendSeen = (receiverId: string) => {
  const s = getSocket();
  if (s) {
    s.emit('seen', receiverId); // The backend 'seen' handler takes receiverId, but it's ambiguous.
                               // It seems to mark messages *from* sender (client.data.userId) *to* receiverId as seen.
  }
};
