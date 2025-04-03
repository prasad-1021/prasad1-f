/**
 * Mock data for simulating API responses during development
 * This file serves as a placeholder until the backend API is fully integrated
 */

// Use module pattern to create controlled access to mock data
const createMockData = () => {
  // Private data
  let _events = [];

  const _users = [
    {
      id: 'usr-1',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      username: 'testuser', // Username for login
      name: 'Test User',
      preferences: {
        categories: ['Business', 'Technology']
      }
    },
    {
      id: 'usr-2',
      email: 'john@example.com',
      firstName: 'John',
      lastName: 'Doe',
      username: 'johndoe', // Additional user for testing
      name: 'John Doe',
      preferences: {
        categories: ['Education', 'Health']
      }
    }
  ];

  // Public methods to safely access and modify data
  return {
    // Return copies of data to prevent direct mutation
    getEvents() {
      console.log('Getting mock events, current count:', _events.length);
      return _events.map(event => ({ ...event }));
    },
    get users() {
      return _users.map(user => ({ ...user }));
    },
    
    // Methods to modify data safely
    addEvent(event) {
      console.log('Adding event to mock store:', event);
      _events.push(event);
      console.log('Mock store now has', _events.length, 'events');
      return { ...event };
    },
    updateEvent(id, data) {
      console.log('Updating event with ID:', id);
      const index = _events.findIndex(e => e.id === id);
      if (index === -1) throw new Error('Event not found');
      _events[index] = { ..._events[index], ...data };
      return { ..._events[index] };
    },
    deleteEvent(id) {
      const index = _events.findIndex(e => e.id === id);
      if (index === -1) throw new Error('Event not found');
      _events.splice(index, 1);
      return { success: true };
    },
    addUser(user) {
      _users.push(user);
      return { ...user };
    },
    updateUser(id, data) {
      const index = _users.findIndex(u => u.id === id);
      if (index === -1) throw new Error('User not found');
      _users[index] = { ..._users[index], ...data };
      return { ..._users[index] };
    }
  };
};

// Create the mock data instance
const mockDataInstance = createMockData();

// Export the mock data
export const getMockEvents = mockDataInstance.getEvents;
export const mockUsers = mockDataInstance.users;
export const mockTokens = {
  accessToken: 'mock-jwt-token-12345',
  refreshToken: 'mock-refresh-token-67890',
  expiresIn: 3600 // seconds
};

// Export methods to safely modify mock data
export const addMockEvent = mockDataInstance.addEvent;
export const updateMockEvent = mockDataInstance.updateEvent;
export const deleteMockEvent = mockDataInstance.deleteEvent;
export const addMockUser = mockDataInstance.addUser;
export const updateMockUser = mockDataInstance.updateUser;

// Simulate API delay
export const simulateApiDelay = (min = 300, max = 800) => {
  const delay = Math.floor(Math.random() * (max - min + 1) + min);
  return new Promise(resolve => setTimeout(resolve, delay));
};

// Simulate API error (randomly fails 10% of the time if enabled)
export const simulateApiError = (probability = 0, errorMessage = 'Simulated API error') => {
  if (probability > 0 && Math.random() < probability) {
    throw new Error(errorMessage);
  }
};

// Ensure test user exists for easier login (for demo purposes)
const ensureTestUser = () => {
  // If no test user exists, add one
  if (!mockUsers.some(u => u.username === 'test')) {
    addMockUser({
      id: 'usr-test',
      email: 'test@test.com',
      firstName: 'Test',
      lastName: 'User',
      username: 'test',
      name: 'Test User',
      _devPassword: 'password',
      preferences: {
        categories: ['Sales']
      }
    });
    console.log('Added test user for easy login. Username: test, Password: password');
  }
};

// Call on module load for easier testing
ensureTestUser();

/**
 * Simulates an API response for meeting participants
 * @param {string} meetingId - Meeting ID to get participants for
 * @returns {Array} - Participants data
 */
export const getMockParticipants = (meetingId) => {
  // Generate between 3-7 participants
  const count = Math.floor(Math.random() * 5) + 3;
  const participants = [];
  
  // Example names
  const firstNames = ['John', 'Jane', 'Michael', 'Emily', 'David', 'Sarah', 'Robert', 'Olivia', 'William', 'Ava'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis', 'Garcia', 'Rodriguez', 'Wilson'];
  
  // Generate participants
  for (let i = 0; i < count; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const name = `${firstName} ${lastName}`;
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`;
    
    // Randomly assign status (bias towards accepted)
    const statusRoll = Math.random();
    let status;
    if (i === 0) {
      // First participant is always the current user - set to pending for testing
      status = 'pending';
    } else if (statusRoll < 0.6) {
      status = 'accepted';
    } else if (statusRoll < 0.8) {
      status = 'pending';
    } else {
      status = 'rejected'; // These should be filtered out
    }
    
    participants.push({
      id: `user-${i}-${Date.now()}`,
      name,
      email,
      status,
      profileImage: null
    });
  }
  
  return participants;
}; 