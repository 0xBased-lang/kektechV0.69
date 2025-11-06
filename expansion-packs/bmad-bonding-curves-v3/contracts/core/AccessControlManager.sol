// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IAccessControlManager.sol";
import "../interfaces/IMasterRegistry.sol";

/**
 * @title AccessControlManager
 * @notice Role-based access control for KEKTECH 3.0
 * @dev Gas-optimized RBAC with enumeration support
 * @custom:security-contact security@kektech.io
 */
contract AccessControlManager is IAccessControlManager {
    // ============= State Variables (Gas Optimized) =============

    // Core state
    address public immutable registry;
    bool public paused;

    // Role storage
    struct RoleData {
        mapping(address => bool) members;
        bytes32 adminRole;
        address[] memberList; // For enumeration
        mapping(address => uint256) memberIndex; // 1-indexed for gas efficiency
    }

    mapping(bytes32 => RoleData) private _roles;

    // ============= Constants =============

    bytes32 public constant DEFAULT_ADMIN_ROLE = 0x00;
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    bytes32 public constant RESOLVER_ROLE = keccak256("RESOLVER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant TREASURY_ROLE = keccak256("TREASURY_ROLE");

    // ============= Modifiers =============

    modifier onlyRole(bytes32 role) {
        _checkRole(role, msg.sender);
        _;
    }

    modifier whenNotPaused() {
        if (paused) revert ContractPaused();
        _;
    }

    // ============= Constructor =============

    constructor(address _registry) {
        if (_registry == address(0)) revert ZeroAddress();
        registry = _registry;

        // Grant DEFAULT_ADMIN_ROLE to deployer
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);

        // Set DEFAULT_ADMIN_ROLE as its own admin
        _roles[DEFAULT_ADMIN_ROLE].adminRole = DEFAULT_ADMIN_ROLE;
    }

    // ============= Role Management =============

    /**
     * @notice Grant a role to an account
     * @param role Role identifier
     * @param account Account to grant role to
     */
    function grantRole(bytes32 role, address account)
        external
        override
        onlyRole(getRoleAdmin(role))
        whenNotPaused
    {
        _grantRole(role, account);
    }

    /**
     * @notice Revoke a role from an account
     * @param role Role identifier
     * @param account Account to revoke role from
     */
    function revokeRole(bytes32 role, address account)
        external
        override
        onlyRole(getRoleAdmin(role))
        whenNotPaused
    {
        _revokeRole(role, account);
    }

    /**
     * @notice Renounce a role (caller renounces their own role)
     * @param role Role identifier
     */
    function renounceRole(bytes32 role) external override {
        _revokeRole(role, msg.sender);
    }

    /**
     * @notice Grant role to multiple accounts in batch
     * @param role Role identifier
     * @param accounts Array of accounts to grant role to
     */
    function grantRoleBatch(bytes32 role, address[] calldata accounts)
        external
        override
        onlyRole(getRoleAdmin(role))
        whenNotPaused
    {
        if (accounts.length == 0) revert InvalidRole();

        for (uint256 i = 0; i < accounts.length; i++) {
            _grantRole(role, accounts[i]);
        }
    }

    /**
     * @notice Revoke role from multiple accounts in batch
     * @param role Role identifier
     * @param accounts Array of accounts to revoke role from
     */
    function revokeRoleBatch(bytes32 role, address[] calldata accounts)
        external
        override
        onlyRole(getRoleAdmin(role))
        whenNotPaused
    {
        if (accounts.length == 0) revert InvalidRole();

        for (uint256 i = 0; i < accounts.length; i++) {
            _revokeRole(role, accounts[i]);
        }
    }

    // ============= Role Admin Management =============

    /**
     * @notice Set admin role for a role
     * @param role Role to set admin for
     * @param adminRole Admin role identifier
     */
    function setRoleAdmin(bytes32 role, bytes32 adminRole)
        external
        override
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        bytes32 previousAdminRole = _roles[role].adminRole;
        _roles[role].adminRole = adminRole;
        emit RoleAdminChanged(role, previousAdminRole, adminRole);
    }

    /**
     * @notice Get admin role for a role
     * @param role Role identifier
     * @return Admin role identifier
     */
    function getRoleAdmin(bytes32 role) public view override returns (bytes32) {
        return _roles[role].adminRole;
    }

    // ============= Permission Checks =============

    /**
     * @notice Check if account has role
     * @param role Role identifier
     * @param account Account to check
     * @return True if account has role
     */
    function hasRole(bytes32 role, address account)
        public
        view
        override
        returns (bool)
    {
        return _roles[role].members[account];
    }

    /**
     * @notice Check if account has role, revert if not
     * @param role Role identifier
     * @param account Account to check
     */
    function checkRole(bytes32 role, address account) public view override {
        _checkRole(role, account);
    }

    /**
     * @notice Check if account has any of the roles
     * @param roles Array of role identifiers
     * @param account Account to check
     * @return True if account has any of the roles
     */
    function hasAnyRole(bytes32[] calldata roles, address account)
        external
        view
        override
        returns (bool)
    {
        for (uint256 i = 0; i < roles.length; i++) {
            if (hasRole(roles[i], account)) {
                return true;
            }
        }
        return false;
    }

    /**
     * @notice Check if account has all of the roles
     * @param roles Array of role identifiers
     * @param account Account to check
     * @return True if account has all of the roles
     */
    function hasAllRoles(bytes32[] calldata roles, address account)
        external
        view
        override
        returns (bool)
    {
        for (uint256 i = 0; i < roles.length; i++) {
            if (!hasRole(roles[i], account)) {
                return false;
            }
        }
        return true;
    }

    // ============= Enumeration =============

    /**
     * @notice Get number of members for a role
     * @param role Role identifier
     * @return Number of members
     */
    function getRoleMemberCount(bytes32 role)
        external
        view
        override
        returns (uint256)
    {
        return _roles[role].memberList.length;
    }

    /**
     * @notice Get role member at index
     * @param role Role identifier
     * @param index Member index (0-indexed)
     * @return Member address
     */
    function getRoleMember(bytes32 role, uint256 index)
        external
        view
        override
        returns (address)
    {
        return _roles[role].memberList[index];
    }

    /**
     * @notice Get all members of a role
     * @param role Role identifier
     * @return Array of member addresses
     */
    function getAllRoleMembers(bytes32 role)
        external
        view
        override
        returns (address[] memory)
    {
        return _roles[role].memberList;
    }

    // ============= Admin Functions =============

    /**
     * @notice Pause the contract
     */
    function pause() external override onlyRole(PAUSER_ROLE) {
        paused = true;
        emit AccessControlPaused(true);
    }

    /**
     * @notice Unpause the contract
     */
    function unpause() external override onlyRole(PAUSER_ROLE) {
        paused = false;
        emit AccessControlPaused(false);
    }

    // ============= View Functions =============

    /**
     * @notice Check if role is supported
     * @param role Role identifier
     * @return True if role is supported (always true for gas efficiency)
     */
    function supportsRole(bytes32 role) external pure override returns (bool) {
        // All roles are supported by default
        return role != bytes32(0);
    }

    // ============= Internal Functions =============

    /**
     * @dev Internal function to grant role
     * @param role Role identifier
     * @param account Account to grant role to
     */
    function _grantRole(bytes32 role, address account) internal {
        if (account == address(0)) revert ZeroAddress();
        // Note: role == bytes32(0) is valid (DEFAULT_ADMIN_ROLE)

        if (!hasRole(role, account)) {
            _roles[role].members[account] = true;

            // Add to member list for enumeration
            _roles[role].memberList.push(account);
            _roles[role].memberIndex[account] = _roles[role].memberList.length;

            emit RoleGranted(role, account, msg.sender, block.timestamp);
        } else {
            revert RoleAlreadyGranted(account, role);
        }
    }

    /**
     * @dev Internal function to revoke role
     * @param role Role identifier
     * @param account Account to revoke role from
     */
    function _revokeRole(bytes32 role, address account) internal {
        if (!hasRole(role, account)) {
            revert RoleNotHeld(account, role);
        }

        _roles[role].members[account] = false;

        // Remove from member list (swap with last and pop)
        uint256 index = _roles[role].memberIndex[account];
        uint256 lastIndex = _roles[role].memberList.length;

        if (index != lastIndex) {
            address lastMember = _roles[role].memberList[lastIndex - 1];
            _roles[role].memberList[index - 1] = lastMember;
            _roles[role].memberIndex[lastMember] = index;
        }

        _roles[role].memberList.pop();
        delete _roles[role].memberIndex[account];

        emit RoleRevoked(role, account, msg.sender, block.timestamp);
    }

    /**
     * @dev Internal function to check role, revert if not held
     * @param role Role identifier
     * @param account Account to check
     */
    function _checkRole(bytes32 role, address account) internal view {
        if (!hasRole(role, account)) {
            revert UnauthorizedAccess(account, role);
        }
    }
}
