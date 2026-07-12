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

    constructor(string memory name_, string memory symbol_, address poolReceiver_, address vault_) ERC20(name_, symbol_) {
        factory = msg.sender;
        canonicalVault = vault_;
        deployedAt = block.timestamp;
        _mint(poolReceiver_, POOL_SUPPLY);
        _mint(address(this), VAULT_SUPPLY);
    }

    function lockVault() external {
        require(!vaultLocked, "Vault locked");
        require(block.timestamp >= deployedAt, "Wait");
        vaultLocked = true;
        _transfer(address(this), canonicalVault, balanceOf(address(this)));
    }

    function burnFromVault(uint256 amount) external {
        require(msg.sender == canonicalVault, "Only vault");
        _burn(canonicalVault, amount);
    }
}
