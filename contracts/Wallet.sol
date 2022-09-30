pragma solidity 0.6.0;
pragma experimental ABIEncoderV2;

contract Wallet {
       constructor(address[] memory _approvers, uint _quorum) public {
        approvers = _approvers;
        quorum = _quorum;
    }

    struct NewApprover {
        uint id;
        address newApprover;
        uint approvals;
        address proposer;
        bool sent;
    }

    uint public thisBalance =0;

    function addApprover(address newApprover) public payable{
        require (msg.value == 5e16);
        approvers.push(newApprover);
    }

    function getBalance() public view returns (uint){
        return (address(this).balance);
    }

    NewApprover[] public newApprovers;
    mapping(address => mapping (uint=>bool)) public approverApprovals;



    function createNewApprover(address _newApprover) public onlyApprover(){
        newApprovers.push(
            NewApprover(
                newApprovers.length,
                _newApprover,
                0,
                msg.sender,
                false
            )
        );
    }

function approveNewApprover(uint id) external onlyApprover() {
        require(newApprovers[id].sent == false, 'new approver has already been confirmed');
        require(approverApprovals[msg.sender][id] == false, 'cannot approve new approver twice');
        
        approverApprovals[msg.sender][id] = true;
        newApprovers[id].approvals++;
        
        if(newApprovers[id].approvals >= quorum) {
            newApprovers[id].sent = true;
            approvers.push(newApprovers[id].newApprover);
        }
    }

    address[] public approvers;
    uint public quorum;
    struct Transfer {
        uint id;
        uint amount;
        address payable to;
        uint approvals;
        address poposer;
        bool sent;
    }
    Transfer[] public transfers;
    mapping(address => mapping(uint => bool)) public approvals;

    function hasApproved(uint id) public view returns (bool){
        return (approvals[msg.sender][id]);
    }
    function isSent(uint id) public view returns (bool){
        return(transfers[id].sent);
    }
    
 
    
    function getApprovers() external view returns(address[] memory) {
        return approvers;
    }
    
    function getTransfers() external view returns(Transfer[] memory) {
        return transfers;
    }

    function createTransfer(uint amount, address payable to) external onlyApprover() {
        transfers.push(Transfer(
            transfers.length,
            amount,
            to,
            0,
            msg.sender,
            false
        ));
    }
    
    function approveTransfer(uint id) external onlyApprover() {
        require(transfers[id].sent == false, 'transfer has already been sent');
        require(approvals[msg.sender][id] == false, 'cannot approve transfer twice');
        
        approvals[msg.sender][id] = true;
        transfers[id].approvals++;
        
        if(transfers[id].approvals >= quorum) {
            thisBalance-=transfers[id].amount;
            transfers[id].sent = true;
            address payable to = transfers[id].to;
            uint amount = transfers[id].amount;
            to.transfer(amount);
        }
    }
    function receiveEther() public payable{
        thisBalance+=msg.value;
    }

    receive() external payable {
        thisBalance+=msg.value;
    }
    
    modifier onlyApprover() {
        bool allowed = false;
        for(uint i = 0; i < approvers.length; i++) {
            if(approvers[i] == msg.sender) {
                allowed = true;
            }
        }
        require(allowed == true, 'only approver allowed');
        _;
    }
}
