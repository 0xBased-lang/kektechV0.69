// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title IAccessControlManager
 * @notice Interface for centralized access control in KEKTECH 3.0
 */
interface IAccessControlManager {
    /**
     * @notice Check if an address has a specific role
     * @param account Address to check
     * @param role Role to check
     * @return True if has role
     */
    function hasRole(bytes32 role, address account) external view returns (bool);

    /**
     * @notice Grant a role to an address
     * @param role Role to grant
     * @param account Address to grant role to
     */
    function grantRole(bytes32 role, address account) external;

    /**
     * @notice Revoke a role from an address
     * @param role Role to revoke
     * @param account Address to revoke role from
     */
    function revokeRole(bytes32 role, address account) external;

    /**
     * @notice Get the admin role for a specific role
     * @param role Role to query
     * @return Admin role
     */
    function getRoleAdmin(bytes32 role) external view returns (bytes32);

    // Role constants
    function ADMIN_ROLE() external view returns (bytes32);
    function RESOLVER_ROLE() external view returns (bytes32);
    function OPERATOR_ROLE() external view returns (bytes32);
    function PAUSER_ROLE() external view returns (bytes32);
}