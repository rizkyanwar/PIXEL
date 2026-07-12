// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

contract MockPool {
    address public owner;
    address public token;

    uint256 public immutable startingMarketCapWei;
    uint256 public immutable seededAmount;
    uint256 public immutable createdAt;

    event TokenSet(address indexed token);

    constructor(
        address token_,
        uint256 startingMarketCapWei_,
        uint256 seededAmount_
    ) {
        owner = msg.sender;
        token = token_;
        startingMarketCapWei = startingMarketCapWei_;
        seededAmount = seededAmount_;
        createdAt = block.timestamp;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    function setToken(address token_) external onlyOwner {
        require(token_ != address(0), "Bad token");
        require(token == address(0), "Token already set");

        token = token_;

        emit TokenSet(token_);
    }
}