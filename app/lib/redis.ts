// Mock Redis implementation
class MockRedis {
  async get() {
    return null;
  }
  
  async set() {
    return 'OK';
  }
  
  async incr() {
    return 1;
  }
  
  async scard() {
    return 0;
  }
  
  async sadd() {
    return 1;
  }
}

export const redis = new MockRedis();
