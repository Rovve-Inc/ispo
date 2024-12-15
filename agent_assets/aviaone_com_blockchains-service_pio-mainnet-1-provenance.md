URL: https://aviaone.com/blockchains-service/pio-mainnet-1-provenance.html
---
![AviaOne logo](dist/img/AviaOne-logo.png)

# **PROVENANCE** (Chain ID : pio-mainnet-1)  by AviaOne BlockChains Service 🟢

1. [Home](./)
2. [Provenance](https://aviaone.com/blockchains-service/pio-mainnet-1-provenance.html)
3. **(Chain ID : pio-mainnet-1)**

![Logo Provenance](dist/img/logo-provenance.jpg)

# PROVENANCE

Provenance Blockchain, the open-source platform that offers seamless exchange capabilities for various markets and financial assets.

- **Token name :**HASH

**Bond Denom :**nhash
- **Chain ID :**pio-mainnet-1
- **Current version :**v1.20.2
- **Current block number :**20854581
- [Website](https://provenance.io/ "Website")
\|
[Twitter](https://twitter.com/provenancefdn "Twitter")
\|
[Discord](https://discord.gg/ENAsjSNY "Discord")
- **Official Blockchain Explorer :** [by Provenance](https://explorer.provenance.io/dashboard)
- **Blockchain Explorer :** [Provenance by AviaOne](https://mainnet.explorer.aviaone.com/provenance)
- **Blockchain Explorer :** [Provenance by Mintscan](https://www.mintscan.io/provenance)

* * *

**Learn more about Provenance :** [Go to the AviaOne's website about Provenance](https://aviaone.com/provenance-blockchain-finance "Website")

### Public endpoints

- [RPC](https://rpc.provenance.io "RPC Provenance")

\|
[API](https://api.provenance.io/ "API Provenance")

### Aviaone endpoints

- [RPC](https://rpc.pio-mainnet-1.provenance.aviaone.com "RPC Provenance by AviaOne BlockChains Service 🟢")
\|
[API](https://api.pio-mainnet-1.provenance.aviaone.com "API Provenance by AviaOne BlockChains Service 🟢")
\|
[GRPC](http://grpc.pio-mainnet-1.provenance.aviaone.com:9231 "GRPC Provenance by AviaOne BlockChains Service 🟢")

- [INSTALL](#install)
- [USEFUL COMMANDS](#usefull_commands)
- [PEERS](#peers)
- [SEED](#seeds)
- [ADDRBOOK](#addrbook)
- [GENESIS](#genesis)
- [SNAPSHOT](#snapshot)
- [STATE SYNC](#statesync)

[Install Go](#3) [Install App and build](#4) [Set variables](#5) [Initialize the node (part 1)](#6) [Initialize the node (part 2)](#7) [Snapshot](#8) [Create service to START and STOP](#9) [Now get synced and check](#10) [Create or recover a wallet](#11) [Create your validator](#12)

##### STEP 1  Update your server to get the latest version

```bash
sudo apt update && sudo apt upgrade -y
```

Copy

##### STEP 2  Install packages

```bash
sudo apt install git curl wget tar lz4 unzip jq build-essential pkg-config clang bsdmainutils make ncdu -y
```

Copy

##### STEP 3  Install Go

Go is a programming language allowing each node of the Cosmos ecosystem to operate.

Go is a compiled and concurrent programming language inspired by C and Pascal.

This language was developed by Google from an initial concept by Robert Griesemer, Rob Pike and Ken Thompson.

```bash
cd $HOME
version="1.23.3"
wget "https://golang.org/dl/go$version.linux-amd64.tar.gz"
sudo rm -rf /usr/local/go
sudo tar -C /usr/local -xzf "go$version.linux-amd64.tar.gz"
rm "go$version.linux-amd64.tar.gz"
echo "export PATH=$PATH:/usr/local/go/bin:$HOME/go/bin" >> $HOME/.bash_profile
source $HOME/.bash_profile
```

Copy

Check GO version, it must return : **go version go1.23.3 linux/amd64**

```bash
go version
```

Copy

Top page

##### STEP 4  Install App and build

Here we will install the node for Provenance with this binary version : v1.20.2

**Please be sure to install the latest version** one last minute version can be published !
[Please check by yourself here...](https://github.com/provenance-io/provenance.git)

```bash

```

Copy

```bash
cd $HOME
git clone https://github.com/provenance-io/provenance.git
cd provenance
git checkout v1.20.2
make install
```

Copy

Check if the binary "provenanced" version v1.20.2 has been correctly installed

```bash
provenanced version
```

Copy

Top page

##### STEP 5  Set variables

What does **moniker** mean?

A personal name or nickname. This name ( **moniker**) will appear in the blockchain explorer.

**SPACE in your moniker will create errors**

```bash
PROVENANCE_MONIKER="Replace_AVIAONE_by_your_name"
```

Copy

Top page

##### STEP 6  Initialize the node (part 1)

We are now ready to initialze the node

```bash
provenanced init $PROVENANCE_MONIKER --chain-id pio-mainnet-1 --home $HOME/.provenanced
```

Copy

Top page

##### STEP 7  Initialize the node (part 2)

**Set minimum gas price**

```bash
sed -i -e "s|^minimum-gas-prices *=.*|minimum-gas-prices = \"1905nhash\"|" $HOME/.provenanced/config/app.toml
```

Copy

**Download genesis**

```bash
wget -O $HOME/.provenanced/config/genesis.json "https://services.pio-mainnet-1.provenance.aviaone.com/genesis.json"
```

Copy

**Download addrbook**

```bash
wget -O $HOME/.provenanced/config/addrbook.json "https://services.pio-mainnet-1.provenance.aviaone.com/addrbook.json"
```

Copy

**Add Seeds**

```bash
SEEDS="258f523c96efde50d5fe0a9faeea8a3e83be22ca@seed.pio-mainnet-1.provenance.aviaone.com:10277"
sed -i -e "s|^seeds *=.*|seeds = \"$SEEDS\"|" $HOME/.provenanced/config/config.toml
```

Copy

**Change ports**

Advanced users ONLY !

**Clear Data**

```bash
provenanced tendermint unsafe-reset-all $HOME/.provenanced --keep-addr-book
```

Copy

Top page

##### STEP 8  Create service to START and STOP (/etc/systemd/system)

This will let you start and stop your node with **/etc/systemd/system**

```bash
sudo tee /etc/systemd/system/provenanced.service > /dev/null <<EOF
[Unit]
Description=PROVENANCE\n
After=network.target
[Service]
Type=simple
User=$USER
ExecStart=$(which provenanced) start --home $HOME/.provenanced
Restart=on-failure
RestartSec=10
LimitNOFILE=65535
[Install]
WantedBy=multi-user.target
EOF
```

Copy

```bash
sudo systemctl enable provenanced
sudo systemctl daemon-reload
```

Copy

**This command will start your node**

Do not use it now if you are going to use below : Snapshot \| State Sync (because your node shouldn't start now... but after the Snapshot \| State Sync)

```bash
sudo systemctl restart provenanced && journalctl -u provenanced -f --no-hostname -o cat
```

Copy

Top page

##### STEP 9 SNAPSHOT **SNAPSHOT (After do no use STATE SYNC if you get synced, this is make no sense !)**

##### How to use ?    The best way is just copy and past this code below in your terminal and that's it ! Your snapshot will be done.

![Generic placeholder image](dist/img/icon-file.jpg)

##### SNAPSHOT Provenance (Chain ID : pio-mainnet-1)

**(updated every 24 hours)**

File name : https://services.pio-mainnet-1.provenance.aviaone.com/pio-mainnet-1\_2024-12-15.tar.gz

[Download this file](https://services.pio-mainnet-1.provenance.aviaone.com/pio-mainnet-1_2024-12-15.tar.gz)

* * *

```bash
sudo systemctl stop provenanced
cp $HOME/.provenanced/data/priv_validator_state.json $HOME/.provenanced/priv_validator_state.json.backup
provenanced tendermint unsafe-reset-all --home $HOME/.provenanced --keep-addr-book
wget -c https://services.pio-mainnet-1.provenance.aviaone.com/pio-mainnet-1_2024-12-15.tar.gz -O - | tar -xz -C $HOME/.provenanced
mv $HOME/.provenanced/priv_validator_state.json.backup $HOME/.provenanced/data/priv_validator_state.json
sudo systemctl start provenanced && sudo journalctl -u provenanced -f --no-hostname -o cat
```

Copy

Top page

##### STEP 9 STATE SYNC **STATE SYNC (After do not use SNAPSHOT if you get synced, this is make no sense !)**

##### How to use ?    The best way is just copy and past this code below in your terminal and that's it ! Your StateSync will be done.

**Please be sure to use the latest binary version :****v1.20.2**

##### Optional to clean your previous State Sync

```bash
sed -i "/\[statesync\]/, /^enable =/ s/=.*/= false/;\
/^rpc_servers =/ s|=.*|= \"\"|;\
/^trust_height =/ s/=.*/= 0/;\
/^trust_hash =/ s/=.*/= \"\"/" $HOME/.provenanced/config/config.toml

```

Copy

```bash
sudo systemctl stop provenanced
SNAP_RPC="https://rpc.pio-mainnet-1.provenance.aviaone.com:443"
LATEST_HEIGHT=$(curl -s $SNAP_RPC/block | jq -r .result.block.header.height); \
BLOCK_HEIGHT=$((LATEST_HEIGHT - 1000)); \
TRUST_HASH=$(curl -s "$SNAP_RPC/block?height=$BLOCK_HEIGHT" | jq -r .result.block_id.hash)

```

Copy

##### Check if you get a positive return

```bash
echo $LATEST_HEIGHT $BLOCK_HEIGHT $TRUST_HASH

```

Copy

##### Copy and past !

```bash
sed -i "/\[statesync\]/, /^enable =/ s/=.*/= true/;\
/^rpc_servers =/ s|=.*|= \"$SNAP_RPC,$SNAP_RPC\"|;\
/^trust_height =/ s/=.*/= $BLOCK_HEIGHT/;\
/^trust_hash =/ s/=.*/= \"$TRUST_HASH\"/" $HOME/.provenanced/config/config.toml

```

Copy

##### Reset all data

```bash
sudo systemctl stop provenanced && provenanced tendermint unsafe-reset-all --home $HOME/.provenanced --keep-addr-book

```

Copy

##### Add WASM folder without cache

```bash
 wget -c https://services.pio-mainnet-1.provenance.aviaone.com/wasm.tar.gz -O - | tar -xz -C /.provenanced/data
```

Copy

##### Start Sync

```bash
sudo systemctl start provenanced && journalctl -u provenanced -f --no-hostname -o cat

```

Copy

**Watch your logs and be patient it can take 5 minutes.... !!**

##### STEP 10  Now get synced and check 20854581

With the command used just above, your node just started, now **BE PATIENT** your node has started to work

and will need time to get synced on the last block.

First check your logs and have a look at what's going on !

You should see some output like this which confirm that your node is indexing blocks

```bash
### indexed block exents height=20854581 module=txindex
```

Copy

How to check if your node is already fully synced? ?

```bash
provenanced status 2>&1 | jq .SyncInfo
```

Copy

**The current block number is :****20854581** and the last block app hash is :K9Gk28XXs1fayU17BdvlS/0SL/UEOQfrk27bVpdbHsg=

**true** mean syncing on the way, and **true is NOT SYNCED**

You will see an output with :

```bash
"catching_up": false
```

Copy

If you get **true** instead of **false**, please wait... it's not done yet, it's on the way...

**true** mean syncing on the way, and **true is NOT SYNCED**

**The current block number is :****20854581** and the last block app hash is :K9Gk28XXs1fayU17BdvlS/0SL/UEOQfrk27bVpdbHsg=

Top page

##### STEP 11  Create or recover a wallet

Why it's better to get synced before to create or recover a wallet ?

Because when your wallet will be created or recovered, if you are not synced, you will not be able to check the balance !

Create Wallet

```bash
provenanced keys add name_wallet
```

Copy

Recover Wallet

```bash
provenanced keys add name_wallet --recover
```

Copy

Top page

##### STEP 12  Create your validator (NEVER DO IT if you are not already synced with the last block)

Create your validator if you are not synced, you will get some troubles...

```bash
provenanced tx staking create-validator \
 --amount=1000000nhash \
 --pubkey=$(provenanced tendermint show-validator) \
 --moniker="YOUR_NICKNAME" \
 --chain-id=pio-mainnet-1 \
 --commission-rate=0.05 \
 --commission-max-rate=0.2 \
 --commission-max-change-rate=0.02 \
 --min-self-delegation=1 \
 --website="https://your-website.com" \
 --identity="keyBASE_id" \
 --details="This is will be display in the blockchain explorer. Write here something about you"\
 --gas-prices=0.1nhash \
 --gas-adjustment=1.5 \
 --gas=auto \
 --from=WRITE_HERE_YOUR_WALLET_ADDRESS
```

Copy

Top page

##### LAST STEP **EVERYTHING IS DONE !!!**

Congratulations, your made all the steps above necessary to setup the node for **PROVENANCE (chain-id=pio-mainnet-1)** with success and your node is already online now.

Top page

##### Find here the most useful commands for Provenance (--chain-id pio-mainnet-1)

- [Most used](#tab_1)
- [Wallet \| Key](#tab_2)
- [Governance \| Vote](#tab_3)
- [Validators](#tab_4)
- [Tokens](#tab_5)
- [Utility](#tab_6)

Check balance

```bash
provenanced q bank balances YOUR_WALLET_NUMBER
```

Copy

Check Sync

Must return **false** to get synced

```bash
provenanced status 2>&1 | jq .SyncInfo
```

Copy

Check logs

```bash
journalctl -u provenanced -f --no-hostname -o cat
```

Copy

Vote

(In some case that's necessary to add "fees" or --gas=auto)

```bash
provenanced tx gov vote 14 yes --from YOUR_WALLET_NUMBER --chain-id pio-mainnet-1
```

Copy

UnJail

(In some case that's necessary to add "fees" or --gas=auto)

```bash
provenanced tx slashing unjail --chain-id=pio-mainnet-1 --from YOUR_WALLET_NUMBER -y
```

Copy

Restart and see logs

```bash
sudo systemctl restart provenanced && journalctl -u provenanced -f --no-hostname -o cat
```

Copy

Check balance

```bash
provenanced q bank balances YOUR_WALLET_NUMBER
```

Copy

Create wallet

```bash
provenanced keys add YOUR_WALLER_NAME
```

Copy

Recover existing wallet

```bash
provenanced keys add YOUR_WALLET_NUMBER --recover
```

Copy

Get a list of all your wallets with this node

```bash
provenanced keys list
```

Copy

Delete Wallet

```bash
provenanced keys delete YOUR_WALLET_NUMBER
```

Copy

Vote YES

(In some case that's necessary to add "fees" or --gas=auto)

```bash
provenanced tx gov vote 14 yes --from YOUR_WALLET_NUMBER --chain-id pio-mainnet-1
```

Copy

Vote NO

(In some case that's necessary to add "fees" or --gas=auto)

```bash
provenanced tx gov vote 14 no --from YOUR_WALLET_NUMBER --chain-id pio-mainnet-1
```

Copy

Vote NO\_WITH\_VETO

(In some case that's necessary to add "fees" or --gas=auto)

```bash
provenanced tx gov vote 14 no_with_veto --from YOUR_WALLET_NUMBER --chain-id pio-mainnet-1
```

Copy

Vote ABSTAIN

(In some case that's necessary to add "fees" or --gas=auto)

```bash
provenanced tx gov vote 14 abstain --from YOUR_WALLET_NUMBER --chain-id pio-mainnet-1
```

Copy

List of all Proposals

(In some case that's necessary to add "fees" or --gas=auto)

```bash
provenanced query gov proposals
```

Copy

View one proposal with the ID

(In some case that's necessary to add "fees" or --gas=auto)

```bash
provenanced query gov proposal 14
```

Copy

Create your own proposal

(In some case that's necessary to adjust : "deposit" or "fees" or --gas=auto)

```bash
provenanced tx gov submit-proposal \
--from YOUR_WALLET_NUMBER \
--chain-id pio-mainnet-1 \
--deposit=100000000nhash \
--type="Text" \
--title="Write here the title of your proposal for Provenance" \
--description="Describe here with details your proposal for Provenance" \
--fees=10000nhash \
--gas=auto \
-y
```

Copy

Unjail validator

(In some case that's necessary to add "fees" or --gas=auto)

```bash
provenanced tx slashing unjail --chain-id=pio-mainnet-1 --from YOUR_WALLET_NUMBER -y
```

Copy

Find your validator number

```bash
provenanced keys show YOUR_WALLET_NUMBER --bech val -a
```

Copy

Validator all info

```bash
provenanced query staking validator YOUR_VALIDATOR_VALOPER --output json
```

Copy

```bash
provenanced q staking validator $(provenanced keys show YOUR_WALLET_NUMBER --bech val -a)
```

Copy

Validator signing info

```bash
provenanced query slashing signing-info $(provenanced tendermint show-validator)
```

Copy

Validator voting power

```bash
provenanced status 2>&1 | jq .ValidatorInfo
```

Copy

List all active validators

```bash
provenanced q staking validators -oj --limit=3000 | jq '.validators[] | select(.status=="BOND_STATUS_BONDED")' | jq -r '(.tokens|tonumber/pow(10; 6)|floor|tostring) + " \t " + .description.moniker' | sort -gr | nl
```

Copy

List all inactive validators

```bash
provenanced q staking validators -oj --limit=3000 | jq '.validators[] | select(.status=="BOND_STATUS_UNBONDED")' | jq -r '(.tokens|tonumber/pow(10; 6)|floor|tostring) + " \t " + .description.moniker' | sort -gr | nl
```

Copy

Change validator info seen in the blockchain explorer

```bash
provenanced tx staking edit-validator \
--new-moniker="Replace AVIAONE by your name" \
--identity=YOUR_KEYBASE_ID \
--details="This is will be display in the blockchain explorer. Write here something about you" \
--chain-id=pio-mainnet-1 \
--commission-rate=0.1 \
--from=YOUR_WALLET_NUMBER \
--gas-prices=0.1nhash \
--gas-adjustment=1.5 \
--gas=auto \
-y
```

Copy

Create your validator

**(NEVER DO IT if you are not already synced with the latest block)**

```bash
provenanced tx staking create-validator \
--amount=1000000nhash \
--pubkey=$(pio-mainnet-1 tendermint show-validator) \
--moniker="Replace AVIAONE by your name" \
--identity=YOUR_KEYBASE_ID \
--details="This is will be display in the blockchain explorer. Write here something about you" \
--chain-id=pio-mainnet-1 \
--commission-rate=0.10 \
--commission-max-rate=0.20 \
--commission-max-change-rate=0.01 \
--min-self-delegation=1 \
--from=YOUR_WALLET_NUMBER \
--gas-prices=0.1nhash \
--gas-adjustment=1.5 \
--gas=auto \
-y
```

Copy

Send tokens from your wallet to an other wallet

(In some case that's necessary to add "fees" or --gas=auto)

```bash
provenanced tx bank send WALLET_SENDER WALLET_RECEIVER 1000000nhash --chain-id=pio-mainnet-1
```

Copy

Delegate tokens to one external validator

(In some case that's necessary to add "fees" or --gas=auto)

```bash
provenanced tx staking delegate WALLET_NUMBER_WHERE_YOU_WANT_DELEGATE 1000000nhash --from YOUR_WALLET_NUMBER --chain-id=pio-mainnet-1
```

Copy

Self Delegate

(In some case that's necessary to add "fees" or --gas=auto)

```bash
provenanced tx staking delegate YOUR_VALIDATOR_NUMBER 1000000nhash --from YOUR_WALLET_NUMBER --chain-id=pio-mainnet-1
```

Copy

Get rewards from delegations

```bash
provenanced tx distribution withdraw-all-rewards --from YOUR_WALLET_NUMBER
```

Copy

Get rewards and commission from your validator

```bash
provenanced tx distribution withdraw-rewards YOUR_VALIDATOR_NUMBER --from YOUR_WALLET_NUMBER --commission
```

Copy

Redelegate

```bash
Under contruction
```

Copy

Under contruction

```bash
Under contruction
```

Copy

Under contruction

```bash
Under contruction
```

Copy

Set minimum gas price

```bash
sed -i -e "s/^minimum-gas-prices *=.*/minimum-gas-prices = \"0nhash\"/" $HOME/.provenanced/config/app.toml
```

Copy

Disable indexer

```bash
sed -i -e 's|^indexer *=.*|indexer = "null"|' $HOME/.provenanced/config/config.toml
```

Copy

Enable indexer

```bash
sed -i -e 's|^indexer *=.*|indexer = "kv"|' $HOME/.provenanced/config/config.toml
```

Copy

Get your peer

```bash
echo $(provenanced tendermint show-node-id)'@'$(curl -s ifconfig.me)':'$(cat $HOME/.provenanced/config/config.toml | sed -n '/Address to listen for incoming connection/{n;p;}' | sed 's/.*://; s/".*//')
```

Copy

Get all peers from this chain : pio-mainnet-1

```bash
curl -sS https://rpc.pio-mainnet-1.provenance.aviaone.com/net_info | jq -r '.result.peers[] | "\(.node_info.id)@\(.remote_ip):\(.node_info.listen_addr)"' | awk -F ':' '{print $1":"$(NF)}'
```

Copy

Remove / delete your node

**YOU ARE GOING TO DELETE EVERYTHING WITHOUT ANY POSSIBILITY TO RECOVER, be sure that's really you are looking for...**

**BEFORE BE SURE TO SAVE $HOME/.provenanced/config/priv\_validator\_key.json**

**This file $HOME/.provenanced/config/priv\_validator\_key.json will let you create a new node with the same validator**

```bash
cd $HOME
sudo systemctl stop provenanced
sudo systemctl disable provenanced
sudo rm /etc/systemd/system/provenanced.service
sudo systemctl daemon-reload
rm -f $(which provenanced)
rm -rf $HOME/.provenanced
rm -rf $HOME/provenance
```

Copy

##### Get all fresh live peers available with the chain pio-mainnet-1

```bash
curl -sS https://rpc.pio-mainnet-1.provenance.aviaone.com/net_info | jq -r '.result.peers[] | "\(.node_info.id)@\(.remote_ip):\(.node_info.listen_addr)"' | awk -F ':' '{print $1":"$(NF)}'

```

Copy

```bash
SEEDS="258f523c96efde50d5fe0a9faeea8a3e83be22ca@seed.pio-mainnet-1.provenance.aviaone.com:10277"
sed -i -e "s|^seeds *=.*|seeds = \"$SEEDS\"|" $HOME/.provenanced/config/config.toml
```

Copy

**(updated every 4 hours)**

```bash
curl -Ls https://services.pio-mainnet-1.provenance.aviaone.com/addrbook.json > $HOME/.provenanced/config/addrbook.json
```

Copy

**(updated every 4 hours)**

```bash
curl -Ls https://services.pio-mainnet-1.provenance.aviaone.com/genesis.json > $HOME/.provenanced/config/genesis.json
```

Copy

[![SNAPSHOT Provenance (Chain ID : pio-mainnet-1)](dist/img/icon-file.jpg)](https://services.pio-mainnet-1.provenance.aviaone.com/pio-mainnet-1_2024-12-15.tar.gz)

##### SNAPSHOT Provenance (Chain ID : pio-mainnet-1)

**(updated every 24 hours)**

File name : https://services.pio-mainnet-1.provenance.aviaone.com/pio-mainnet-1\_2024-12-15.tar.gz

* * *

**Please be sure to use the latest binary version.**

One last minute version can be published ! [Please check by yourself here...](https://github.com/provenance-io/provenance.git) and compare with your node `provenanced version`

##### How to use ?  The best way is just copy and past this code below in your terminal and that's it ! Your snapshot will be done.

```bash
sudo systemctl stop provenanced
cp $HOME/.provenanced/data/priv_validator_state.json $HOME/.provenanced/priv_validator_state.json.backup
provenanced tendermint unsafe-reset-all --home $HOME/.provenanced --keep-addr-book
wget -c https://services.pio-mainnet-1.provenance.aviaone.com/pio-mainnet-1_2024-12-15.tar.gz -O - | tar -xz -C $HOME/.provenanced
mv $HOME/.provenanced/priv_validator_state.json.backup $HOME/.provenanced/data/priv_validator_state.json
sudo systemctl start provenanced && sudo journalctl -u provenanced -f --no-hostname -o cat
```

Copy

**Please be sure to use the latest binary version :****v1.20.2**

##### How to use ?  The best way is just copy and past this code below in your terminal and that's it !

##### Optional to clean your previous State Sync

##### Recommanded when you already get Sync to avoid trouble when you will restart your node next time.

```bash
sed -i "/\[statesync\]/, /^enable =/ s/=.*/= false/;\
/^rpc_servers =/ s|=.*|= \"\"|;\
/^trust_height =/ s/=.*/= 0/;\
/^trust_hash =/ s/=.*/= \"\"/" $HOME/.provenanced/config/config.toml

```

Copy

##### Start here the process for State Sync

```bash
sudo systemctl stop provenanced
SNAP_RPC="https://rpc.pio-mainnet-1.provenance.aviaone.com:443"
LATEST_HEIGHT=$(curl -s $SNAP_RPC/block | jq -r .result.block.header.height); \
BLOCK_HEIGHT=$((LATEST_HEIGHT - 1000)); \
TRUST_HASH=$(curl -s "$SNAP_RPC/block?height=$BLOCK_HEIGHT" | jq -r .result.block_id.hash)

```

Copy

##### Check if you get a positive return

```bash
echo $LATEST_HEIGHT $BLOCK_HEIGHT $TRUST_HASH

```

Copy

##### Copy and past !

```bash
sed -i "/\[statesync\]/, /^enable =/ s/=.*/= true/;\
/^rpc_servers =/ s|=.*|= \"$SNAP_RPC,$SNAP_RPC\"|;\
/^trust_height =/ s/=.*/= $BLOCK_HEIGHT/;\
/^trust_hash =/ s/=.*/= \"$TRUST_HASH\"/" $HOME/.provenanced/config/config.toml

```

Copy

##### Reset all data

```bash
sudo systemctl stop provenanced && provenanced tendermint unsafe-reset-all --home $HOME/.provenanced --keep-addr-book

```

Copy

##### Add WASM folder without cache

```bash
 wget -c https://services.pio-mainnet-1.provenance.aviaone.com/wasm.tar.gz -O - | tar -xz -C /.provenanced/data
```

Copy

##### Now we must restart the node Provenance to initiate synchronization with the chain pio-mainnet-1

```bash
sudo systemctl start provenanced && journalctl -u provenanced -f --no-hostname -o cat

```

Copy

**Watch your logs and be patient it can take 5 minutes.... !!**

##### How to use ?  You are looking for an other way than the command line to connect your wallet with Provenance (Chain ID : pio-mainnet-1)?

![Logo Keplr](dist/img/logo-keplr.jpg)

##### ADD in your Keplr Wallet : Provenance (Chain ID : pio-mainnet-1)

That's an easy process, just click and follow the instructions...it will be done in 10 seconds !

Our platform offers a secure link that allows you to effortlessly connect your KEPLR wallet. The process is quick and easy. Adding a new chain to your wallet is a standard procedure that doesn't involve any transaction. It simply requires your approval. To get started, click on the button below to add this chain to your wallet and start interacting with the blockchain.