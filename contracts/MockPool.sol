// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

contract MockPool {
    address public immutable token;
    uint256 public immutable startingMarketCapWei;
    uint256 public immutable seededAmount;
    uint256 public immutable createdAt;

    constructor(address token_, uint256 startingMarketCapWei_, uint256 seededAmount_) {
        token = token_;
        startingMarketCapWei = startingMarketCapWei_;
        seededAmount = seededAmount_;
        createdAt = block.timestamp;
    }
}
