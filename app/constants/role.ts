enum UserRoles {
    USER = 'user',
    MANAGER = 'manager',
    ADMIN = 'admin',
    SYSTEMADMIN = 'systemadmin',
    OWNER = 'owner',
  }
  
  const allUsers = Object.values(UserRoles);
  
  const adminUsers = [UserRoles.ADMIN, UserRoles.SYSTEMADMIN, UserRoles.OWNER];
  
  export { UserRoles, allUsers, adminUsers };
  