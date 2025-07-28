import type {
  Keyring,
  KeyringAccount,
  KeyringRequest,
  KeyringResponse,
} from '@metamask/keyring-api';

export class WatchOnlyKeyring implements Keyring {
  static type = 'Watch Only';
  public type = WatchOnlyKeyring.type;

  private accounts: Map<string, KeyringAccount> = new Map();

  /**
   * 获取全部账户（对象）
   */
  async listAccounts(): Promise<KeyringAccount[]> {
    return Array.from(this.accounts.values());
  }

  /**
   * 必须返回其中的address
   * @returns
   */
  async getAccounts(): Promise<string[]> {
    return Array.from(this.accounts.values()).map((account) => account.address);
  }

  /**
   * 根据 ID 获取账户
   */
  async getAccount(id: string): Promise<KeyringAccount | undefined> {
    return this.accounts.get(id);
  }

  async createAccount(
    options: Record<string, string> = {},
  ): Promise<KeyringAccount> {
    // 对只读账户来说，我们需要传入地址而非创建
    if (!options.address || typeof options.address !== 'string') {
      throw new Error(
        'Address is required for watch-only accounts, and need string',
      );
    }

    const address = options.address;
    const account: KeyringAccount = {
      id: address,
      address,
      scopes: ['eip155:1', 'eip155:137', 'eip155:10', 'eip155:42161'],
      options: { label: options.label || 'Watch Only Account' },
      methods: [], // 不支持签名方法
      type: 'eip155:eoa',
    };

    this.accounts.set(address, account);
    return account;
  }

  async deleteAccount(id: string): Promise<void> {
    if (!this.accounts.has(id)) {
      throw new Error(`Account ${id} not found`);
    }
    this.accounts.delete(id);
  }

  /**
   * 序列化 keyring，保存账户信息
   */
  async serialize(): Promise<unknown> {
    return {
      accounts: Array.from(this.accounts.values()),
    };
  }

  /**
   * 从持久化数据恢复 keyring
   */
  async deserialize(data: unknown): Promise<void> {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid data to deserialize');
    }

    const raw = data as { accounts: KeyringAccount[] };

    if (!Array.isArray(raw.accounts)) {
      throw new Error('Missing accounts array in deserialize data');
    }

    this.accounts.clear();

    for (const account of raw.accounts) {
      if (!account.id || !account.address) {
        throw new Error('Malformed account data');
      }
      this.accounts.set(account.id, {
        ...account,
        address: account.address ? String(account.address) : 'xxx',
      });
    }
  }

  /**
   * 支持所有链（也可以根据你的场景限制）
   */
  async filterAccountChains(id: string, chains: string[]): Promise<string[]> {
    return chains;
  }

  /**
   * Watch-only 账户不支持更新
   */
  async updateAccount(account: KeyringAccount): Promise<void> {
    const existingAccount = this.accounts.get(account.id);
    if (!existingAccount) {
      throw new Error(`Account ${account.id} not found`);
    }

    // 确保不能改变地址
    if (existingAccount.address !== account.address) {
      throw new Error('Cannot change the address of an existing account');
    }

    // 构造拒绝的错误响应
    throw new Error(`Watch only account ${account.id} cannot updateAccount`);
  }

  // 处理请求：对于任何签名请求，我们都拒绝
  async submitRequest(request: KeyringRequest): Promise<KeyringResponse> {
    // 获取请求的账户
    const accountId = request.account;
    if (!this.accounts.has(accountId)) {
      throw new Error(`Account ${accountId} not found`);
    }

    // 根据请求类型，拒绝签名
    // 注意：这里我们简单拒绝所有请求，因为只读账户不支持任何操作
    // 但为了更好的用户体验，可以区分请求类型并返回更具体的错误

    // 构造拒绝的错误响应
    throw new Error(
      `Watch only account ${accountId} cannot sign transactions or messages`,
    );
  }

  // 以下签名方法在Keyring接口中已经不再需要（因为签名请求通过submitRequest处理）
  // 但为了保持兼容性（如果直接调用），我们也实现它们并抛出错误
  async signMessage(_address: string, _message: string): Promise<string> {
    throw new Error('Watch only accounts cannot sign messages');
  }

  async signTransaction(_transaction: any): Promise<string> {
    throw new Error('Watch only accounts cannot sign transactions');
  }

  async signPersonalMessage(
    _address: string,
    _message: string,
  ): Promise<string> {
    throw new Error('Watch only accounts cannot sign personal messages');
  }

  async signTypedData(_address: string, _data: any): Promise<string> {
    throw new Error('Watch only accounts cannot sign typed data');
  }
}
