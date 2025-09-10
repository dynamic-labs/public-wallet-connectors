// Mock for @dynamic-labs-connectors/base-account-evm
// This provides a CommonJS version of the ES module

class BaseAccountEvmWalletConnector {
  constructor(props) {
    this.props = props;
  }
}

const createBaseAccountConnector = (baseAccountOpts = {}) => {
  return () => [
    class extends BaseAccountEvmWalletConnector {
      constructor(props) {
        super({ ...props, ...baseAccountOpts });
      }
    },
  ];
};

module.exports = {
  BaseAccountEvmWalletConnector,
  createBaseAccountConnector,
};
