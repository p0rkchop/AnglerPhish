// User model tests for AnglerPhish defensive security system
// Tests user creation, password hashing, and validation

const User = require('../../models/User');

describe('User Model', () => {
  describe('User Creation', () => {
    it('should create a user with valid data', async () => {
      const userData = testUtils.createTestUser();
      const user = new User(userData);
      await user.save();

      expect(user._id).toBeDefined();
      expect(user.email).toBe(userData.email);
      expect(user.role).toBe(userData.role);
      expect(user.createdAt).toBeDefined();
      expect(user.lastLogin).toBeUndefined();
    });

    it('should hash password before saving', async () => {
      const userData = testUtils.createTestUser();
      const plainPassword = userData.password;
      
      const user = new User(userData);
      await user.save();

      expect(user.password).not.toBe(plainPassword);
      expect(user.password).toMatch(/^\$2[aby]?\$\d+\$/); // bcrypt hash pattern
    });

    it('should convert email to lowercase', async () => {
      const userData = testUtils.createTestUser({
        email: 'TEST@EXAMPLE.COM',
      });
      
      const user = new User(userData);
      await user.save();

      expect(user.email).toBe('test@example.com');
    });

    it('should require email', async () => {
      const userData = testUtils.createTestUser();
      delete userData.email;

      const user = new User(userData);
      
      await expect(user.save()).rejects.toThrow();
    });

    it('should require unique email', async () => {
      const userData = testUtils.createTestUser();
      
      // Create first user
      const user1 = new User(userData);
      await user1.save();

      // Try to create second user with same email
      const user2 = new User(userData);
      
      await expect(user2.save()).rejects.toThrow();
    });

    it('should validate email format', async () => {
      const userData = testUtils.createTestUser({
        email: 'invalid-email',
      });

      const user = new User(userData);
      
      await expect(user.save()).rejects.toThrow();
    });

    it('should require password', async () => {
      const userData = testUtils.createTestUser();
      delete userData.password;

      const user = new User(userData);
      
      await expect(user.save()).rejects.toThrow();
    });

    it('should validate minimum password length', async () => {
      const userData = testUtils.createTestUser({
        password: '123', // Too short
      });

      const user = new User(userData);
      
      await expect(user.save()).rejects.toThrow();
    });

    it('should default to User role', async () => {
      const userData = testUtils.createTestUser();
      delete userData.role;

      const user = new User(userData);
      await user.save();

      expect(user.role).toBe('User');
    });

    it('should validate role values', async () => {
      const userData = testUtils.createTestUser({
        role: 'InvalidRole',
      });

      const user = new User(userData);
      
      await expect(user.save()).rejects.toThrow();
    });
  });

  describe('Password Methods', () => {
    let user;

    beforeEach(async () => {
      const userData = testUtils.createTestUser();
      user = new User(userData);
      await user.save();
    });

    it('should verify correct password', async () => {
      const isMatch = await user.comparePassword('TestPassword123!');
      expect(isMatch).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const isMatch = await user.comparePassword('WrongPassword');
      expect(isMatch).toBe(false);
    });

    it('should handle empty password comparison', async () => {
      const isMatch = await user.comparePassword('');
      expect(isMatch).toBe(false);
    });

    it('should handle null password comparison', async () => {
      const isMatch = await user.comparePassword(null);
      expect(isMatch).toBe(false);
    });

    it('should rehash password when changed', async () => {
      const originalHash = user.password;
      
      user.password = 'NewPassword123!';
      await user.save();

      expect(user.password).not.toBe(originalHash);
      
      const isMatch = await user.comparePassword('NewPassword123!');
      expect(isMatch).toBe(true);
    });
  });

  describe('Security Features', () => {
    it('should not return password in JSON', async () => {
      const userData = testUtils.createTestUser();
      const user = new User(userData);
      await user.save();

      const userJSON = user.toJSON();
      expect(userJSON).not.toHaveProperty('password');
    });

    it('should track last login updates', async () => {
      const userData = testUtils.createTestUser();
      const user = new User(userData);
      await user.save();

      expect(user.lastLogin).toBeUndefined();

      user.lastLogin = new Date();
      await user.save();

      expect(user.lastLogin).toBeDefined();
      expect(user.lastLogin).toBeInstanceOf(Date);
    });

    it('should handle concurrent saves properly', async () => {
      const userData = testUtils.createTestUser();
      
      // Create multiple users concurrently with different emails
      const users = await Promise.all([
        new User({ ...userData, email: 'user1@test.com' }).save(),
        new User({ ...userData, email: 'user2@test.com' }).save(),
        new User({ ...userData, email: 'user3@test.com' }).save(),
      ]);

      expect(users).toHaveLength(3);
      users.forEach(user => {
        expect(user._id).toBeDefined();
        expect(user.password).toMatch(/^\$2[aby]?\$\d+\$/);
      });
    });
  });

  describe('Query Methods', () => {
    beforeEach(async () => {
      // Create test users
      await User.create([
        testUtils.createTestUser({ email: 'admin1@test.com', role: 'Administrator' }),
        testUtils.createTestUser({ email: 'admin2@test.com', role: 'Administrator' }),
        testUtils.createTestUser({ email: 'user1@test.com', role: 'User' }),
        testUtils.createTestUser({ email: 'user2@test.com', role: 'User' }),
      ]);
    });

    it('should find users by role', async () => {
      const admins = await User.find({ role: 'Administrator' });
      const users = await User.find({ role: 'User' });

      expect(admins).toHaveLength(2);
      expect(users).toHaveLength(2);
    });

    it('should find user by email (case insensitive)', async () => {
      const user = await User.findOne({ email: 'ADMIN1@TEST.COM'.toLowerCase() });
      expect(user).toBeTruthy();
      expect(user.email).toBe('admin1@test.com');
    });

    it('should support case-insensitive email queries', async () => {
      const user1 = await User.findOne({ email: 'admin1@test.com' });
      const user2 = await User.findOne({ email: 'ADMIN1@TEST.COM'.toLowerCase() });

      expect(user1._id.toString()).toBe(user2._id.toString());
    });
  });
});