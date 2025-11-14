// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IAccessControlManager
 * @notice Interface for role-based access control in KEKTECH 3.0
 * @dev Manages permissions for all KEKTECH modules
 */
interface IAccessControlManager {
    // ============= Events =============

    event RoleGranted(
        bytes32 indexed role,
        address indexed account,
        address indexed sender,
        uint256 timestamp
    );

    event RoleRevoked(
        bytes32 indexed role,
        address indexed account,
        address indexed sender,
        uint256 timestamp
    );

    event RoleAdminChanged(
        bytes32 indexed role,
        bytes32 indexed previousAdminRole,
        bytes32 indexed newAdminRole
    );

    event AccessControlPaused(bool isPaused);

    // ============= Errors =============

    error UnauthorizedAccess(address account, bytes32 role);
    error ZeroAddress();
    error RoleAlreadyGranted(address account, bytes32 role);
    error RoleNotHeld(address account, bytes32 role);
    error InvalidRole();
    error ContractPaused();
    error NotRoleAdmin(address account, bytes32 role);

    // ============= Role Management =============

    function grantRole(bytes32 role, address account) external;
    function revokeRole(bytes32 role, address account) external;
    function renounceRole(bytes32 role) external;

    function grantRoleBatch(bytes32 role, address[] calldata accounts) external;
    function revokeRoleBatch(bytes32 role, address[] calldata accounts) external;

    // ============= Role Admin Management =============

    function setRoleAdmin(bytes32 role, bytes32 adminRole) external;
    function getRoleAdmin(bytes32 role) external view returns (bytes32);

    // ============= Permission Checks =============

    function hasRole(bytes32 role, address account) external view returns (bool);
    function checkRole(bytes32 role, address account) external view;

    function hasAnyRole(bytes32[] calldata roles, address account) external view returns (bool);
    function hasAllRoles(bytes32[] calldata roles, address account) external view returns (bool);

    // ============= Enumeration =============

    function getRoleMemberCount(bytes32 role) external view returns (uint256);
    function getRoleMember(bytes32 role, uint256 index) external view returns (address);
    function getAllRoleMembers(bytes32 role) external view returns (address[] memory);

    // ============= Admin Functions =============

    function pause() external;
    function unpause() external;

    // ============= View Functions =============

    function registry() external view returns (address);
    function paused() external view returns (bool);
    function supportsRole(bytes32 role) external view returns (bool);
}
