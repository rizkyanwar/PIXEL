// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract RecomToken is ERC20 {
    uint256 public constant TOTAL_SUPPLY = 1_000_000_000 ether;
    uint256 public constant POOL_SUPPLY = 500_000_000 ether;
    uint256 public constant VAULT_SUPPLY = 500_000_000 ether;

    address public immutable factory;
    address public immutable canonicalVault;
    uint256 public immutable deployedAt;

    bool public vaultLocked;

    event VaultLocked(address indexed vault, uint256 amount);

    constructor(
        string memory name_,
        string memory symbol_,
        address poolReceiver_,
        address vault_
    ) ERC20(name_, symbol_) {
        require(poolReceiver_ != address(0), "Bad pool");
        require(vault_ != address(0), "Bad vault");

        factory = msg.sender;
        canonicalVault = vault_;
        deployedAt = block.timestamp;

        _mint(poolReceiver_, POOL_SUPPLY);
        _mint(address(this), VAULT_SUPPLY);
    }

    modifier onlyFactoryOrVault() {
        require(
            msg.sender == factory || msg.sender == canonicalVault,
            "Not allowed"
        );
        _;
    }

    function vault() external view returns (address) {
        return canonicalVault;
    }

    function lockVault() external onlyFactoryOrVault {
        require(!vaultLocked, "Vault locked");

        uint256 amount = balanceOf(address(this));
        require(amount > 0, "No vault balance");

        vaultLocked = true;

        _transfer(address(this), canonicalVault, amount);

        emit VaultLocked(canonicalVault, amount);
    }

    function burnFromVault(uint256 amount) external {
        require(msg.sender == canonicalVault, "Only vault");
        _burn(canonicalVault, amount);
    }
}