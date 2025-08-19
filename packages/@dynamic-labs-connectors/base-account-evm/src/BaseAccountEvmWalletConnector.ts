'use client'

import { createWalletClient, custom, type WalletClient, type Transport, type Chain, type Account, toHex, toBytes } from 'viem';
import { eventListenerHandlers, logger } from '@dynamic-labs/wallet-connector-core';
import { EthereumWalletConnector, chainsMap, type EthereumWalletConnectorOpts } from '@dynamic-labs/ethereum-core';
import {  getBaseAccountProvider } from './helpers.js';
import { BaseAccountSDKOpts } from './types.js';

export type BaseAccountEvmWalletConnectorOpts = EthereumWalletConnectorOpts & BaseAccountSDKOpts;

export class BaseAccountEvmWalletConnector extends EthereumWalletConnector {

    override name = 'Base Account';
    override canConnectViaCustodialService = true;
    props: BaseAccountEvmWalletConnectorOpts;

    constructor(props: BaseAccountEvmWalletConnectorOpts) {
        super({ ...props, metadata: { id: 'baseAccount', name: 'Base Account', icon: 'https://base.org/favicon.ico' } });
        this.props = props;
    }

    get baseAccountProvider() {
        return getBaseAccountProvider(this.props);
    }

    override async getConnectedAccounts(): Promise<string[]> {
        try {
          const accounts = await this.baseAccountProvider.request({
            method: 'eth_accounts',
          }) as string[];
      
          if (accounts[0]) {
            this.setActiveAccount(this.parseAddress(accounts[0]) as `0x${string}`);
          }
      
          return accounts.map(this.parseAddress);
        } catch (error) {
          logger.error('Error getting connected accounts', error);
          return [];
        }
      }


      override async getAddress(): Promise<string | undefined> {
        try {
            const [address] = await this.baseAccountProvider.request({
              method: 'eth_requestAccounts',
            }) as string[];

            if (!address) {
                throw new Error('No address found');
            }
        
            const parsedAddress = this.parseAddress(address);
            this.setActiveAccount(parsedAddress as `0x${string}`);

            return parsedAddress;
          } catch (error) {
            logger.error('Error requesting address', error);
            return;
          }
      }

    override async signMessage(messageToSign: string): Promise<string | undefined> {
        try {
            const [address] = await this.baseAccountProvider.request({
              method: 'eth_requestAccounts',
            }) as string[];

            if (!address) {
                throw new Error('No address found');
            }

            const parsedAddress = this.parseAddress(address);
        
            const signature = await this.baseAccountProvider.request({
              method: 'personal_sign',
              params: [toHex(toBytes(messageToSign)), parsedAddress],
            }) as string;
        
            return signature;
          } catch (err) {
            logger.error('Error signing message', err);
            return undefined;
          }
    }

    override setupEventListeners(): void {
        const {
            handleAccountChange,
            handleChainChange,
            handleDisconnect,
          } = eventListenerHandlers(this);
        
          this.baseAccountProvider.on('accountsChanged', handleAccountChange);
          this.baseAccountProvider.on('chainChanged', handleChainChange);
          this.baseAccountProvider.on('disconnect', handleDisconnect);
        
          this.teardownEventListeners = () => {
            this.baseAccountProvider.removeListener('accountsChanged', handleAccountChange);
            this.baseAccountProvider.removeListener('chainChanged', handleChainChange);
            this.baseAccountProvider.removeListener('disconnect', handleDisconnect);
          };
    }

    override getWalletClient(chainId?: string): WalletClient<Transport, Chain, Account> | undefined {
        // @ts-expect-error - Dynamic parent functions are returning undefined, but viem expects defined values
        // this function works despite ignoring the type error
        return createWalletClient({
            account: this.getActiveAccount(),
            chain: chainId ? chainsMap[chainId] : this.getActiveChain(),
            transport: custom(this.baseAccountProvider, this.providersConfig.httpTransportConfig),
        });
    }
}