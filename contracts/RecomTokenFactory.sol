// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "./RecomToken.sol";
import "./MockPool.sol";

interface IVaultRegister {
    function registerToken(address token) external;
}

contract RecomTokenFactory {
    address public owner;
    address public launchpad;
    address public vault;

    mapping(address => bool) public validCollection;
    mapping(address => address) public collectionToken;
    mapping(address => address) public tokenPool;

    event CollectionAuthorized(address indexed collection);

    event TokenBonded(
        address indexed collection,
        address indexed token,
        address indexed pool,
        string name,
        string symbol
    );

    constructor(address vault_) {
        require(vault_ != address(0), "Invalid vault");

        owner = msg.sender;
        vault = vault_;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier onlyLaunchpad() {
        require(msg.sender == launchpad, "Only launchpad");
        _;
    }

    function setLaunchpad(address launchpad_) external onlyOwner {
        require(launchpad_ != address(0), "Invalid launchpad");
        launchpad = launchpad_;
    }

    function setVault(address vault_) external onlyOwner {
        require(vault_ != address(0), "Invalid vault");
        vault = vault_;
    }

    function authorizeCollection(address collection) external onlyLaunchpad {
        require(collection != address(0), "Invalid collection");

        validCollection[collection] = true;

        emit CollectionAuthorized(collection);
    }

    function bondToken(
        string calldata tokenName,
        string calldata tokenSymbol,
        uint256 startingMarketCapWei
    ) external returns (address token, address pool) {
        require(validCollection[msg.sender], "Bad collection");
        require(collectionToken[msg.sender] == address(0), "Already bonded");

        MockPool mockPool = new MockPool(
            address(0),
            startingMarketCapWei,
            500_000_000 ether
        );

        pool = address(mockPool);

        token = address(
            new RecomToken(
                tokenName,
                tokenSymbol,
                pool,
                vault
            )
        );

        mockPool.setToken(token);

        collectionToken[msg.sender] = token;
        tokenPool[token] = pool;

        IVaultRegister(vault).registerToken(token);
        RecomToken(token).lockVault();

        emit TokenBonded(msg.sender, token, pool, tokenName, tokenSymbol);
    }
}