// config/permissions.js

// 1. Define all available permissions in the system
const PERMISSIONS = {
    // User Management
    USER_CREATE: 'user:create',
    USER_READ: 'user:read',
    USER_UPDATE: 'user:update',
    USER_DELETE: 'user:delete',

    // Lesson Management
    LESSON_CREATE: 'lesson:create',
    LESSON_READ: 'lesson:read',
    LESSON_UPDATE: 'lesson:update',
    LESSON_DELETE: 'lesson:delete',
    LESSON_APPROVE: 'lesson:approve', // Admin/Head only

    // Class Management
    CLASS_CREATE: 'class:create',
    CLASS_READ: 'class:read',
    CLASS_UPDATE: 'class:update',
    CLASS_DELETE: 'class:delete',

    // Material Management
    MATERIAL_CREATE: 'material:create',
    MATERIAL_READ: 'material:read',
    MATERIAL_DELETE: 'material:delete',

    // Admin Features
    ADMIN_DASHBOARD: 'admin:dashboard',
    SCHOOL_SETTINGS: 'school:settings',
    AUDIT_LOG_READ: 'audit:read',
};

// 2. Map Roles to Permissions
const ROLE_PERMISSIONS = {
    super_admin: Object.values(PERMISSIONS), // All permissions

    admin: [
        PERMISSIONS.USER_CREATE,
        PERMISSIONS.USER_READ,
        PERMISSIONS.USER_UPDATE,
        PERMISSIONS.USER_DELETE,
        PERMISSIONS.LESSON_READ,
        PERMISSIONS.LESSON_DELETE,
        PERMISSIONS.LESSON_APPROVE,
        PERMISSIONS.CLASS_READ,
        PERMISSIONS.MATERIAL_READ,
        PERMISSIONS.MATERIAL_DELETE,
        PERMISSIONS.ADMIN_DASHBOARD,
        PERMISSIONS.SCHOOL_SETTINGS,
        PERMISSIONS.AUDIT_LOG_READ,
    ],

    teacher: [
        PERMISSIONS.LESSON_CREATE,
        PERMISSIONS.LESSON_READ,
        PERMISSIONS.LESSON_UPDATE,
        PERMISSIONS.LESSON_DELETE, // Own lessons only (logic in controller usually)
        PERMISSIONS.CLASS_CREATE,
        PERMISSIONS.CLASS_READ,
        PERMISSIONS.CLASS_UPDATE,
        PERMISSIONS.CLASS_DELETE,
        PERMISSIONS.MATERIAL_CREATE,
        PERMISSIONS.MATERIAL_READ,
        PERMISSIONS.MATERIAL_DELETE,
        PERMISSIONS.USER_READ, // Read basic profile
    ],

    // Example: Head of Math Dept (can approve lessons + teacher permissions)
    math_head: [
        PERMISSIONS.USER_CREATE,
        PERMISSIONS.USER_READ,
        PERMISSIONS.LESSON_CREATE,
        PERMISSIONS.LESSON_READ,
        PERMISSIONS.LESSON_UPDATE,
        PERMISSIONS.LESSON_DELETE,
        PERMISSIONS.LESSON_APPROVE, // Added permission
        PERMISSIONS.CLASS_CREATE,
        PERMISSIONS.CLASS_READ,
        PERMISSIONS.CLASS_UPDATE,
        PERMISSIONS.CLASS_DELETE,
        PERMISSIONS.MATERIAL_CREATE,
        PERMISSIONS.MATERIAL_READ,
        PERMISSIONS.MATERIAL_DELETE,
    ],
    english_head: [
        PERMISSIONS.USER_CREATE,
        PERMISSIONS.USER_READ,
        PERMISSIONS.LESSON_CREATE,
        PERMISSIONS.LESSON_READ,
        PERMISSIONS.LESSON_UPDATE,
        PERMISSIONS.LESSON_DELETE,
        PERMISSIONS.LESSON_APPROVE, // Added permission
        PERMISSIONS.CLASS_CREATE,
        PERMISSIONS.CLASS_READ,
        PERMISSIONS.CLASS_UPDATE,
        PERMISSIONS.CLASS_DELETE,
        PERMISSIONS.MATERIAL_CREATE,
        PERMISSIONS.MATERIAL_READ,
        PERMISSIONS.MATERIAL_DELETE,
    ],
    science_head: [
        PERMISSIONS.USER_CREATE,
        PERMISSIONS.USER_READ,
        PERMISSIONS.LESSON_CREATE,
        PERMISSIONS.LESSON_READ,
        PERMISSIONS.LESSON_UPDATE,
        PERMISSIONS.LESSON_DELETE,
        PERMISSIONS.LESSON_APPROVE, // Added permission
        PERMISSIONS.CLASS_CREATE,
        PERMISSIONS.CLASS_READ,
        PERMISSIONS.CLASS_UPDATE,
        PERMISSIONS.CLASS_DELETE,
        PERMISSIONS.MATERIAL_CREATE,
        PERMISSIONS.MATERIAL_READ,
        PERMISSIONS.MATERIAL_DELETE,
    ],
};

// Helper to check if a role has permission
const hasPermission = (userRoles, permission) => {
    // Flatten permissions from all user roles
    const userPermissions = userRoles.reduce((acc, role) => {
        const perms = ROLE_PERMISSIONS[role] || [];
        return [...acc, ...perms];
    }, []);

    return userPermissions.includes(permission);
};

module.exports = {
    PERMISSIONS,
    ROLE_PERMISSIONS,
    hasPermission,
};
