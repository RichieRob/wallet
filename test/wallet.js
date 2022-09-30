const { expectRevert } = require('@openzeppelin/test-helpers');
const { web3 } = require('@openzeppelin/test-helpers/src/setup');
const { assert } = require("chai");

const Wallet = artifacts.require('Wallet');

contract('Wallet', (accounts) => {
  let wallet;
  beforeEach(async () => {
    wallet = await Wallet.new([accounts[0], accounts[1], accounts[2]], 2); 
    await web3.eth.sendTransaction({from: accounts[0], to: wallet.address, value: 1000}); 
  });

  it('should have correct approvers and quorum', async () => {
    const approvers = await wallet.getApprovers();
    const quorum = await wallet.quorum();
    assert(approvers.length === 3);
    assert(approvers[0] === accounts[0]);
    assert(approvers[1] === accounts[1]);
    assert(approvers[2] === accounts[2]);
    assert(quorum.toNumber() === 2);
  });

  it('should create transfers', async ()=> {
    await wallet.createTransfer(accounts[5], 100, {from: accounts[0]})
    const transfers = await wallet.getTransfers();
    assert(transfers.length ===1);
    assert(transfers[0].id ==="0");
    assert(transfers[0].amount ==="100");
    assert(transfers[0].to === accounts[5]);
    assert(transfers[0].approvers === "0");
    assert(transfers[0].sent === false);
  })

  it('should not create transfers if sender is not approved', async ()=> {
    await expectRevert(
      wallet.createTransfer(accounts[5], 100, {from: accounts[4]}),
      'address not approved'
    );
  })

  //approve but not enough to be sent
  it('should increment approval', async() =>{
  await wallet.createTransfer(accounts[5], 100, {from: accounts[0]})
  await wallet.approveTransfer(0, {from: accounts[0]});
  const transfers = await wallet.getTransfers();
  const balance = await web3.eth.getBalance(wallet.address);
  assert(transfers[0].approvers ==="1");
  assert(transfers[0].sent === false);
  assert(balance === "1000");
  })

  it('should send transfer if quorum reached', async() => {
    const balanceBefore = web3.utils.toBN(await web3.eth.getBalance(accounts[6]));
    await wallet.createTransfer(accounts[6], 100, {from: accounts[0]});
    await wallet.approveTransfer(0, {from: accounts[0]});
    await wallet.approveTransfer(0, {from: accounts[1]});
    const balanceAfter = web3.utils.toBN(await web3.eth.getBalance(accounts[6]));
    assert(balanceAfter.sub(balanceBefore).toNumber()===100);
  })

  it('should NOT approve transfer if sender is not approved', async() =>{
    await wallet.createTransfer(accounts[7], 100, {from: accounts[2]});
    await expectRevert(
      wallet.approveTransfer(0, {from: accounts[8]}),
      'address not approved'
    );
  })

  it('should NOT send transfer if quorum not reached', async() =>{
    const initialBalance = web3.utils.toBN(await web3.eth.getBalance(accounts[8]));
    await wallet.createTransfer(accounts[8], 100, {from: accounts[1]});
    const secondBalance = web3.utils.toBN(await web3.eth.getBalance(accounts[8]));
    await wallet.approveTransfer[0, {from:accounts[2]}];
    const thirdBalance = web3.utils.toBN(await web3.eth.getBalance(accounts[8]));
    assert(initialBalance.sub(secondBalance).toNumber()===0);
    assert(secondBalance.sub(thirdBalance).toNumber()===0);
  })

  it('should NOT approve transfer if transfer already sent', async() =>{
    await wallet.createTransfer(accounts[6], 100, {from: accounts[0]});
    await wallet.approveTransfer(0, {from: accounts[0]});
    await wallet.approveTransfer(0, {from: accounts[1]});
    await expectRevert(
      wallet.approveTransfer(0, {from: accounts[2]}),
      'transfer has already been sent'
    );
  })

  it('should NOT approve if transfer has already been approved by this account', async() =>{
    await wallet.createTransfer(accounts[9], 100, {from: accounts[1]});
    await wallet.approveTransfer(0, {from: accounts[0]});
    await expectRevert(
      wallet.approveTransfer(0, {from: accounts[0]}),
      'transfer already approved by this address'
    ); 
  })


});
