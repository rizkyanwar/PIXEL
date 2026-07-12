// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IRecomTokenBurn {
    function burnFromVault(uint256 amount) external;
}

contract RecomVault {
    address public owner;
    address public tokenFactory;

    uint256[5] public epochTimes = [
        uint256(1 days),
        7 days,
        14 days,
        28 days,
        56 days
    ];

    mapping(address => uint256) public tokenStart;
    mapping(address => uint8) public executedEpochs;

    event TokenRegistered(address indexed token, uint256 startTime);

    event EpochExecuted(
        address indexed token,
        uint8 indexed epoch,
        uint256 airdropped,
        uint256 burned
    );

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    function setTokenFactory(address _tokenFactory) external onlyOwner {
        require(_tokenFactory != address(0), "Bad factory");
        tokenFactory = _tokenFactory;
    }

    function registerToken(address token) external {
        require(
            msg.sender == owner || msg.sender == tokenFactory,
            "Not allowed"
        );
        require(tokenStart[token] == 0, "Registered");

        tokenStart[token] = block.timestamp;

        emit TokenRegistered(token, block.timestamp);
    }

    function executeEpoch(
        address token,
        address[] calldata losers
    ) external onlyOwner {
        uint8 epoch = executedEpochs[token];

        require(epoch < 5, "Done");
        require(tokenStart[token] > 0, "Not registered");
        require(
            block.timestamp >= tokenStart[token] + epochTimes[epoch],
            "Too early"
        );
        require(losers.length > 0 && losers.length <= 100, "Bad losers");

        uint256 total = 1_000_000_000 ether;
        uint256 airdropTotal = total / 100; // 1%
        uint256 burnAmount = (total * 9) / 100; // 9%
        uint256 each = airdropTotal / losers.length;

        IERC20 erc = IERC20(token);

        for (uint256 i = 0; i < losers.length; i++) {
            erc.transfer(losers[i], each);
        }

        IRecomTokenBurn(token).burnFromVault(burnAmount);

        executedEpochs[token] = epoch + 1;

        emit EpochExecuted(token, epoch + 1, each * losers.length, burnAmount);
    }
}