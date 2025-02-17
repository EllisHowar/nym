import React, { FC } from 'react';
import { ChainProvider, useChain } from '@cosmos-kit/react';
import { assets, chains } from 'chain-registry';
import { wallets as keplr } from '@cosmos-kit/keplr';
import { wallets as ledger } from '@cosmos-kit/ledger';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { Alert, AlertTitle } from '@mui/material';
import { Wallet } from '@cosmos-kit/core';
import { CosmosKitLedger } from './ledger';
import { CosmosKitSign } from './sign';

const CosmosKitSetup: FC<{ children: React.ReactNode }> = ({ children }) => {
  const assetsFixedUp = React.useMemo(() => {
    const nyx = assets.find((a) => a.chain_name === 'nyx');
    if (nyx) {
      const nyxCoin = nyx.assets.find((a) => a.name === 'nyx');
      if (nyxCoin) {
        nyxCoin.coingecko_id = 'nyx';
      }
      nyx.assets = nyx.assets.reverse();
    }
    return assets;
  }, [assets]);

  const chainsFixedUp = React.useMemo(() => {
    const nyx = chains.find((c) => c.chain_id === 'nyx');
    if (nyx) {
      if (!nyx.staking) {
        nyx.staking = {
          staking_tokens: [{ denom: 'unyx' }],
          lock_duration: {
            blocks: 10000,
          },
        };
      }
    }
    return chains;
  }, [chains]);

  return (
    <ChainProvider
      chains={chainsFixedUp}
      assetLists={assetsFixedUp}
      wallets={[...ledger, ...keplr]}
      signerOptions={{
        preferredSignType: () => 'amino',
      }}
    >
      {children}
    </ChainProvider>
  );
};

function walletRejectMessageOrError(wallet?: Wallet, error?: React.ReactNode) {
  if (!wallet) {
    if (!error) {
      return undefined;
    }
    return error;
  }
  if (typeof wallet.rejectMessage === 'string') {
    return wallet.rejectMessage;
  }
  return wallet.rejectMessage.source;
}
const Wrapper: FC<{
  children?: React.ReactNode;
  wallet?: Wallet;
  header?: React.ReactNode;
  error?: React.ReactNode;
  disconnect: () => Promise<void>;
}> = ({ wallet, disconnect, error, header, children }) => {
  if (error) {
    return (
      <Box mt={4} mb={2}>
        <Alert severity="error">
          {wallet && <AlertTitle>Failed to connect to {wallet.prettyName}</AlertTitle>}
          {wallet && walletRejectMessageOrError(wallet)}
        </Alert>
        <Box mt={2}>
          <Button variant="outlined" onClick={disconnect}>
            Retry
          </Button>
        </Box>
      </Box>
    );
  }
  return (
    <Box mt={4} mb={2}>
      <Box display="flex" justifyContent="space-between">
        {header && header}
        <Button variant="outlined" onClick={disconnect}>
          Disconnect
        </Button>
      </Box>
      {children}
    </Box>
  );
};

const CosmosKitInner = () => {
  const {
    wallet,
    address,
    connect,
    disconnect,
    isWalletConnecting,
    isWalletDisconnected,
    isWalletError,
    isWalletNotExist,
    isWalletRejected,
  } = useChain('nyx');

  if (isWalletError) {
    return <Wrapper wallet={wallet} error="Oh no! Something went wrong." disconnect={disconnect} />;
  }

  if (isWalletNotExist) {
    return <Wrapper wallet={wallet} error="Oh no! Could not connect to that wallet." disconnect={disconnect} />;
  }

  if (isWalletRejected) {
    return (
      <Wrapper
        wallet={wallet}
        error="Oh no! Did you authorize the connection to your wallet?"
        disconnect={disconnect}
      />
    );
  }

  if (isWalletDisconnected) {
    return (
      <Button variant="outlined" onClick={connect} sx={{ mt: 4 }}>
        Connect your wallet
      </Button>
    );
  }

  if (isWalletConnecting) {
    return <CircularProgress />;
  }

  // Ledger Hardware Wallet
  if (wallet.mode === 'ledger') {
    return (
      <Wrapper
        header={
          <Box>
            <strong>Connected to {wallet.prettyName}</strong>
            <Typography>
              Address: <code>{address}</code>{' '}
            </Typography>
          </Box>
        }
        disconnect={disconnect}
      >
        <CosmosKitLedger />
      </Wrapper>
    );
  }

  // Extension or Wallet Connect
  return (
    <Wrapper
      header={
        <Box>
          <strong>Connected to {wallet.prettyName}</strong>
          <Typography>
            Address: <code>{address}</code>{' '}
          </Typography>
        </Box>
      }
      disconnect={disconnect}
    >
      <CosmosKitSign />
    </Wrapper>
  );
};

export const CosmosKit = () => (
  <CosmosKitSetup>
    <CosmosKitInner />
  </CosmosKitSetup>
);
