<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 to-green-50">
    <!-- Header -->
    <header class="bg-white shadow-lg border-b sticky top-0 z-50 backdrop-blur-sm bg-white/95">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center py-4 flex-wrap">
          <div class="flex items-center space-x-4 flex-shrink-0">
            <div class="flex items-center">
              <div
                class="w-10 h-10 bg-gradient-to-br from-green-700 to-[#10e80c] rounded-lg flex items-center justify-center text-white font-bold text-lg mr-3">
                N
              </div>
              <div>
                <h1 class="text-2xl font-bold text-gray-900 leading-tight">Nosana Kit</h1>
                <div class="flex items-center space-x-2 text-xs text-gray-500 h-4">
                  <span>Documentation</span>
                  <span>•</span>
                  <a href="https://www.npmjs.com/package/@nosana/kit" target="_blank"
                    class="text-blue-600 hover:text-blue-800 transition-colors no-underline">
                    📦 @nosana/kit
                  </a>
                  <span>•</span>
                  <span class="bg-green-100 text-green-800 px-2 py-0.5 rounded-full whitespace-nowrap">v1.0.0</span>
                </div>
              </div>
            </div>
          </div>
          <div class="flex items-center space-x-4 flex-shrink-0">
            <div class="flex items-center bg-gray-50 rounded-lg px-3 py-2">
              <label class="text-sm font-medium text-gray-700 mr-2 whitespace-nowrap">Network:</label>
              <select v-model="selectedNetwork" @change="initializeClient"
                class="bg-transparent border-0 text-sm font-medium focus:outline-none focus:ring-0 min-w-[100px]">
                <option value="mainnet">🌐 Mainnet</option>
                <option value="devnet">🧪 Devnet</option>
              </select>
            </div>
            <div class="flex items-center space-x-2 min-w-[120px]">
              <div :class="[
                'w-2 h-2 rounded-full flex-shrink-0',
                isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
              ]"></div>
              <span class="text-sm font-medium whitespace-nowrap"
                :class="isConnected ? 'text-green-700' : 'text-red-700'">
                {{ isConnected ? 'Connected' : 'Disconnected' }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Installation Section -->
      <div class="mb-8 bg-gradient-to-r from-green-700 to-[#10e80c] rounded-xl p-8 text-white">
        <div class="grid lg:grid-cols-2 gap-8 items-center">
          <div>
            <h1 class="text-4xl font-bold mb-4">🚀 Nosana Kit</h1>
            <p class="text-green-100 text-lg mb-6">
              Decentralized compute network SDK for AI inference and computational tasks.
              Test APIs interactively and see real-time results.
            </p>
            <div class="flex flex-wrap gap-3">
              <span class="bg-white/20 px-3 py-1 rounded-full text-sm">TypeScript Ready</span>
              <span class="bg-white/20 px-3 py-1 rounded-full text-sm">Real-time Testing</span>
              <span class="bg-white/20 px-3 py-1 rounded-full text-sm">Interactive Docs</span>
            </div>
          </div>
          <div class="bg-gray-900 rounded-lg p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-semibold">Installation</h3>
              <button @click="copyInstallCommand" class="text-gray-400 hover:text-white transition-colors"
                title="Copy to clipboard">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z">
                  </path>
                </svg>
              </button>
            </div>
            <code class="text-green-400 font-mono text-sm">npm install @nosana/kit</code>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <!-- Sidebar Navigation -->
        <div class="lg:col-span-1">
          <div class="bg-white rounded-xl shadow-lg sticky top-24">
            <div class="p-6">
              <h3 class="font-semibold text-gray-900 mb-4">📚 API Reference</h3>
              <nav class="space-y-2">
                <a href="#sdk-init" @click="scrollToSection('sdk-init')"
                  class="flex items-center space-x-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors cursor-pointer">
                  <span>🔧</span>
                  <span>SDK Initialization</span>
                </a>
                <a href="#job-retrieval" @click="scrollToSection('job-retrieval')"
                  class="flex items-center space-x-2 text-sm text-gray-600 hover:text-green-600 hover:bg-green-50 px-3 py-2 rounded-lg transition-colors cursor-pointer">
                  <span>📋</span>
                  <span>Job Retrieval</span>
                </a>
                <a href="#market-discovery" @click="scrollToSection('market-discovery')"
                  class="flex items-center space-x-2 text-sm text-gray-600 hover:text-orange-600 hover:bg-orange-50 px-3 py-2 rounded-lg transition-colors cursor-pointer">
                  <span>🏪</span>
                  <span>Market Discovery</span>
                </a>
                <a href="#monitoring" @click="scrollToSection('monitoring')"
                  class="flex items-center space-x-2 text-sm text-gray-600 hover:text-purple-600 hover:bg-purple-50 px-3 py-2 rounded-lg transition-colors cursor-pointer">
                  <span>📡</span>
                  <span>Real-time Monitoring</span>
                </a>
              </nav>
            </div>
          </div>
        </div>

        <!-- Main Content -->
        <div :class="[
          'transition-all duration-300',
          'lg:col-span-4'
        ]">
          <div class="space-y-8">
            <!-- 1. SDK Initialization -->
            <div id="sdk-init" class="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
              <div class="bg-gradient-to-r from-blue-500 to-blue-600 px-8 py-6">
                <div class="flex items-center justify-between">
                  <h2 class="text-2xl font-bold text-white">🔧 SDK Initialization</h2>
                  <span class="bg-white/20 px-3 py-1 rounded-full text-sm text-blue-100">Core</span>
                </div>
              </div>

              <div class="p-8">
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <!-- Documentation -->
                  <div class="lg:col-span-2">
                    <div class="prose prose-blue max-w-none">
                      <h4 class="text-xl font-semibold text-gray-900 mb-4">📚 Documentation</h4>

                      <!-- Method Signature -->
                      <div class="bg-gray-50 rounded-lg p-4 mb-6">
                        <div class="flex items-center justify-between mb-2">
                          <h5 class="font-semibold text-gray-700">Constructor</h5>
                          <span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">TypeScript</span>
                        </div>
                        <code class="text-sm font-mono text-[#10e80c]">
                          new NosanaClient(network: NosanaNetwork, customConfig?: PartialClientConfig)
                        </code>
                      </div>

                      <!-- TypeScript Types -->
                      <div class="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 mb-6">
                        <button @click="toggleTypeInfo('init')"
                          class="flex items-center justify-between w-full text-left">
                          <h5 class="font-semibold text-[#10e80c]">🔍 TypeScript Types</h5>
                          <svg :class="['w-4 h-4 transition-transform', showTypeInfo.init ? 'rotate-180' : '']"
                            fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7">
                            </path>
                          </svg>
                        </button>
                        <div v-show="showTypeInfo.init" class="mt-4 space-y-3">
                          <div class="bg-white rounded p-3 text-sm font-mono">
                            <div class="text-blue-600">enum</div>
                            <div class="text-[#10e80c]">NosanaNetwork</div>
                            <div class="ml-4 text-gray-600">MAINNET = "mainnet"</div>
                            <div class="ml-4 text-gray-600">DEVNET = "devnet"</div>
                          </div>
                          <div class="bg-white rounded p-3 text-sm font-mono">
                            <div class="text-blue-600">interface</div>
                            <div class="text-[#10e80c]">NosanaClient</div>
                            <div class="ml-4 text-gray-600">config: ClientConfig</div>
                            <div class="ml-4 text-gray-600">solana: SolanaUtils</div>
                            <div class="ml-4 text-gray-600">jobs: JobsProgram</div>
                            <div class="ml-4 text-gray-600">logger: Logger</div>
                            <div class="ml-4 text-gray-600">wallet?: KeyPairSigner</div>
                            <div class="ml-4 text-gray-600">setWallet(config: WalletConfig):
                              Promise&lt;KeyPairSigner&gt;</div>
                          </div>
                          <div class="bg-white rounded p-3 text-sm font-mono">
                            <div class="text-blue-600">interface</div>
                            <div class="text-[#10e80c]">ClientConfig</div>
                            <div class="ml-4 text-gray-600">solana: SolanaConfig</div>
                            <div class="ml-4 text-gray-600">programs: ProgramsConfig</div>
                            <div class="ml-4 text-gray-600">ipfs: IpfsConfig</div>
                            <div class="ml-4 text-gray-600">wallet?: WalletConfig</div>
                          </div>
                          <div class="bg-white rounded p-3 text-sm font-mono">
                            <div class="text-blue-600">type</div>
                            <div class="text-[#10e80c]">PartialClientConfig</div>
                            <div class="ml-4 text-gray-600">= Partial&lt;ClientConfig&gt;</div>
                            <div class="ml-6 text-gray-500">// All properties optional for custom configuration</div>
                          </div>
                          <div class="bg-white rounded p-3 text-sm font-mono">
                            <div class="text-blue-600">interface</div>
                            <div class="text-[#10e80c]">SolanaConfig</div>
                            <div class="ml-4 text-gray-600">rpcEndpoint: string</div>
                            <div class="ml-4 text-gray-600">cluster: SolanaClusterMoniker</div>
                          </div>
                          <div class="bg-white rounded p-3 text-sm font-mono">
                            <div class="text-blue-600">interface</div>
                            <div class="text-[#10e80c]">ProgramsConfig</div>
                            <div class="ml-4 text-gray-600">jobsAddress: Address</div>
                            <div class="ml-4 text-gray-600">nosTokenAddress: Address</div>
                            <div class="ml-4 text-gray-600">rewardsAddress: Address</div>
                          </div>
                          <div class="bg-white rounded p-3 text-sm font-mono">
                            <div class="text-blue-600">interface</div>
                            <div class="text-[#10e80c]">IpfsConfig</div>
                            <div class="ml-4 text-gray-600">gatewayUrl: string</div>
                            <div class="ml-4 text-gray-600">pinataJwt?: string</div>
                            <div class="ml-4 text-gray-600">timeout?: number</div>
                          </div>
                          <div class="bg-white rounded p-3 text-sm font-mono">
                            <div class="text-blue-600">type</div>
                            <div class="text-[#10e80c]">WalletConfig</div>
                            <div class="ml-4 text-gray-600">= string | number[] | KeyPairSigner</div>
                            <div class="ml-6 text-gray-500">// JSON string, number array, or keypair instance</div>
                          </div>
                        </div>
                      </div>

                      <!-- Description -->
                      <p class="text-gray-700 mb-6">
                        Initialize a new Nosana client instance to interact with the decentralized compute network.
                        The network parameter determines which Solana cluster to connect to for blockchain operations.
                        You can optionally provide custom configuration to override default settings like RPC endpoints,
                        program addresses, or IPFS gateways. You can also set a wallet to enable transaction signing and
                        job posting.
                      </p>

                      <!-- Code Example -->
                      <div class="bg-gray-900 rounded-lg overflow-hidden mb-6">
                        <button @click="toggleCodeExample('init')"
                          class="w-full flex items-center justify-between bg-gray-800 px-4 py-2 hover:bg-gray-700 transition-colors">
                          <span class="text-gray-300 text-sm font-medium">Example Usage</span>
                          <svg
                            :class="['w-4 h-4 transition-transform text-gray-400', showCodeExample.init ? 'rotate-180' : '']"
                            fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7">
                            </path>
                          </svg>
                        </button>
                        <div v-show="showCodeExample.init" class="p-4">
                          <pre
                            class="text-sm"><code class="text-green-400">import</code> <code class="text-blue-400">{ NosanaClient, NosanaNetwork }</code> <code class="text-green-400">from</code> <code class="text-yellow-400">'@nosana/kit'</code>

<code class="text-gray-500">// Initialize for devnet (testing)</code>
<code class="text-green-400">const</code> <code class="text-blue-400">client</code> <code class="text-white">=</code> <code class="text-green-400">new</code> <code class="text-yellow-400">NosanaClient</code><code class="text-white">(</code><code class="text-blue-400">NosanaNetwork</code><code class="text-white">.</code><code class="text-blue-400">DEVNET</code><code class="text-white">)</code>

<code class="text-gray-500">// Initialize for mainnet with custom config</code>
<code class="text-green-400">const</code> <code class="text-blue-400">customConfig</code> <code class="text-white">=</code> <code class="text-white">{</code>
  <code class="text-blue-400">solana</code><code class="text-white">:</code> <code class="text-white">{</code>
    <code class="text-blue-400">rpcEndpoint</code><code class="text-white">:</code> <code class="text-yellow-400">'https://custom-rpc.com'</code>
  <code class="text-white">}</code>
<code class="text-white">}</code>
<code class="text-green-400">const</code> <code class="text-blue-400">prodClient</code> <code class="text-white">=</code> <code class="text-green-400">new</code> <code class="text-yellow-400">NosanaClient</code><code class="text-white">(</code><code class="text-blue-400">NosanaNetwork</code><code class="text-white">.</code><code class="text-blue-400">MAINNET</code><code class="text-white">,</code> <code class="text-blue-400">customConfig</code><code class="text-white">)</code>

<code class="text-gray-500">// Access configuration</code>
<code class="text-blue-400">console</code><code class="text-white">.</code><code class="text-yellow-400">log</code><code class="text-white">(</code><code class="text-blue-400">client</code><code class="text-white">.</code><code class="text-blue-400">config</code><code class="text-white">.</code><code class="text-blue-400">solana</code><code class="text-white">.</code><code class="text-blue-400">rpcEndpoint</code><code class="text-white">)</code>

<code class="text-gray-500">// Set wallet for transaction signing</code>
<code class="text-green-400">const</code> <code class="text-blue-400">keypair</code> <code class="text-white">=</code> <code class="text-yellow-400">'[66,240,117,68,169,30...]'</code>
<code class="text-green-400">const</code> <code class="text-blue-400">wallet</code> <code class="text-white">=</code> <code class="text-green-400">await</code> <code class="text-blue-400">client</code><code class="text-white">.</code><code class="text-yellow-400">setWallet</code><code class="text-white">(</code><code class="text-blue-400">keypair</code><code class="text-white">)</code>
<code class="text-blue-400">console</code><code class="text-white">.</code><code class="text-yellow-400">log</code><code class="text-white">(</code><code class="text-yellow-400">'Wallet address:'</code><code class="text-white">,</code> <code class="text-blue-400">wallet</code><code class="text-white">.</code><code class="text-blue-400">address</code><code class="text-white">)</code></pre>
                        </div>
                      </div>

                      <!-- Network Info -->
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
                          <h6 class="font-semibold text-blue-900 mb-2">🌐 Mainnet</h6>
                          <p class="text-blue-800 text-sm">Production environment with real SOL tokens and live compute
                            jobs.</p>
                        </div>
                        <div class="bg-green-50 border-l-4 border-green-400 p-4 rounded">
                          <h6 class="font-semibold text-green-900 mb-2">🧪 Devnet</h6>
                          <p class="text-green-800 text-sm">Testing environment with test tokens for development and
                            experimentation.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Interactive Controls -->
                  <div class="lg:col-span-1">
                    <div class="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 sticky top-24">
                      <h4 class="font-semibold text-gray-900 mb-4">🎮 Try It Now</h4>
                      <div class="space-y-4">
                        <!-- Network Status -->
                        <div class="bg-white rounded-lg p-4 border border-blue-200">
                          <div class="flex items-center space-x-2 mb-3">
                            <div :class="[
                              'w-3 h-3 rounded-full',
                              isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                            ]"></div>
                            <span class="text-sm font-medium text-gray-700">
                              {{ selectedNetwork.toUpperCase() }} Network
                            </span>
                          </div>
                          <p class="text-sm text-gray-600 mb-3">
                            SDK initialized and ready for {{ selectedNetwork }} operations
                          </p>
                          <p class="text-xs text-gray-500">
                            💡 Switch networks using the dropdown in the header
                          </p>
                        </div>

                        <!-- Wallet Management -->
                        <div class="bg-white rounded-lg p-4 border border-blue-200">
                          <div class="flex items-center justify-between mb-3">
                            <span class="text-sm font-semibold text-gray-700">
                              🔐 Wallet
                            </span>
                            <div class="flex items-center">
                              <div :class="[
                                'w-2 h-2 rounded-full mr-2',
                                currentWallet ? 'bg-green-500' : 'bg-gray-400'
                              ]"></div>
                              <span class="text-xs font-medium"
                                :class="currentWallet ? 'text-green-700' : 'text-gray-600'">
                                {{ currentWallet ? 'Connected' : 'None' }}
                              </span>
                            </div>
                          </div>

                          <div v-if="currentWallet" class="mb-3 p-2 bg-green-50 rounded text-xs">
                            <div class="font-mono text-green-800 break-all">
                              {{ currentWallet.substring(0, 8) }}...{{ currentWallet.substring(currentWallet.length - 8)
                              }}
                            </div>
                          </div>

                          <!-- Wallet Input Method Selection -->
                          <select v-model="walletInputMethod"
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-3">
                            <option value="paste">📋 Paste Private Key</option>
                            <option value="file">📁 Upload Keypair File</option>
                          </select>

                          <!-- Paste Private Key Input -->
                          <div v-if="walletInputMethod === 'paste'" class="mb-3">
                            <textarea v-model="walletInputs.privateKey"
                              placeholder="Paste your private key in any format:&#10;• JSON Array: [66,240,117,68,169,30,179,62,...]&#10;• Number Array: 66,240,117,68,169,30,179,62,...&#10;• Base58: 2Ld9Q8E9TxsSPf9Zkxn55u2EuuXBZUiV..."
                              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              rows="4"></textarea>
                            <p class="text-xs text-gray-500 mt-1">
                              💡 Supports JSON array, number array, or Base58 format - the SDK will auto-detect!
                            </p>
                          </div>

                          <!-- File Upload -->
                          <div v-if="walletInputMethod === 'file'" class="mb-3">
                            <input ref="fileInput" type="file" accept=".json" @change="handleFileUpload"
                              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                            <p class="text-xs text-gray-500 mt-1">
                              📁 Upload a JSON keypair file (e.g., from Solana CLI)
                            </p>
                          </div>

                          <!-- Set Wallet Button -->
                          <button @click="setWallet" :disabled="loading || !canSetWallet"
                            class="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium text-sm shadow-lg hover:shadow-xl mb-2">
                            <span v-if="loading" class="flex items-center justify-center">
                              <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor"
                                  stroke-width="4"></circle>
                                <path class="opacity-75" fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                                </path>
                              </svg>
                              Setting...
                            </span>
                            <span v-else>🔐 Set Wallet</span>
                          </button>

                          <!-- Clear Wallet Button -->
                          <button v-if="currentWallet" @click="clearWallet"
                            class="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-200 font-medium text-sm">
                            🗑️ Clear Wallet
                          </button>

                          <!-- Demo Keypair Button -->
                          <button @click="loadDemoKeypair"
                            class="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 font-medium text-sm mt-2">
                            🎯 Load Demo Keypair
                          </button>
                        </div>

                        <!-- Connection Test -->
                        <button @click="testConnection" :disabled="loading"
                          class="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-lg hover:shadow-xl">
                          <span v-if="loading" class="flex items-center justify-center">
                            <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4">
                              </circle>
                              <path class="opacity-75" fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                              </path>
                            </svg>
                            Testing...
                          </span>
                          <span v-else class="flex items-center justify-center">
                            🔍 Test Connection
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 2. Job Retrieval -->
            <div id="job-retrieval" class="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
              <div class="bg-gradient-to-r from-green-500 to-green-600 px-8 py-6">
                <div class="flex items-center justify-between">
                  <h2 class="text-2xl font-bold text-white">📋 Job Retrieval</h2>
                  <span class="bg-white/20 px-3 py-1 rounded-full text-sm text-green-100">Jobs API</span>
                </div>
              </div>

              <div class="p-8">
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <!-- Documentation -->
                  <div class="lg:col-span-2">
                    <div class="prose prose-green max-w-none">
                      <h4 class="text-xl font-semibold text-gray-900 mb-4">📚 Documentation</h4>

                      <!-- Method Signatures -->
                      <div class="space-y-6">
                        <div class="bg-gray-50 rounded-lg p-4">
                          <div class="flex items-center justify-between mb-3">
                            <h5 class="font-semibold text-gray-700">Get Single Job</h5>
                            <span class="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">async</span>
                          </div>
                          <code class="text-sm font-mono text-purple-600 block mb-3">
                            client.jobs.get(address: PublicKey): Promise&lt;Job&gt;
                          </code>
                          <p class="text-gray-700 text-sm">Retrieve a specific job by its blockchain address.</p>
                        </div>

                        <div class="bg-gray-50 rounded-lg p-4">
                          <div class="flex items-center justify-between mb-3">
                            <h5 class="font-semibold text-gray-700">Get Multiple Jobs</h5>
                            <span class="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">async</span>
                          </div>
                          <code class="text-sm font-mono text-purple-600 block mb-3">
                            client.jobs.all(filters?: JobFilters): Promise&lt;Job[]&gt;
                          </code>
                          <p class="text-gray-700 text-sm">Retrieve multiple jobs with optional filtering capabilities.
                            The SDK also provides additional methods like <code
                              class="text-xs bg-gray-100 px-1 rounded">runs()</code>, <code
                              class="text-xs bg-gray-100 px-1 rounded">multiple()</code>, and <code
                              class="text-xs bg-gray-100 px-1 rounded">post()</code> for advanced use cases.
                          </p>
                        </div>
                      </div>

                      <!-- TypeScript Types -->
                      <div class="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 mt-6">
                        <button @click="toggleTypeInfo('jobs')"
                          class="flex items-center justify-between w-full text-left">
                          <h5 class="font-semibold text-green-900">🔍 TypeScript Types</h5>
                          <svg :class="['w-4 h-4 transition-transform', showTypeInfo.jobs ? 'rotate-180' : '']"
                            fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7">
                            </path>
                          </svg>
                        </button>
                        <div v-show="showTypeInfo.jobs" class="mt-4 space-y-3">
                          <div class="bg-white rounded p-3 text-sm font-mono">
                            <div class="text-blue-600">interface</div>
                            <div class="text-purple-600">Job</div>
                            <div class="ml-4 text-gray-600">address: string</div>
                            <div class="ml-4 text-gray-600">state: number</div>
                            <div class="ml-4 text-gray-600">market: Address</div>
                            <div class="ml-4 text-gray-600">node: Address</div>
                            <div class="ml-4 text-gray-600">payer: Address</div>
                            <div class="ml-4 text-gray-600">project: Address</div>
                            <div class="ml-4 text-gray-600">price: number</div>
                            <div class="ml-4 text-gray-600">ipfsJob: string</div>
                            <div class="ml-4 text-gray-600">ipfsResult: string</div>
                            <div class="ml-4 text-gray-600">timeStart: number</div>
                            <div class="ml-4 text-gray-600">timeEnd: number</div>
                            <div class="ml-4 text-gray-600">timeout: number</div>
                          </div>
                          <div class="bg-white rounded p-3 text-sm font-mono">
                            <div class="text-blue-600">interface</div>
                            <div class="text-purple-600">JobFilters</div>
                            <div class="ml-4 text-gray-600">state?: number</div>
                            <div class="ml-4 text-gray-600">market?: Address</div>
                            <div class="ml-4 text-gray-600">node?: Address</div>
                            <div class="ml-4 text-gray-600">project?: Address</div>
                          </div>
                        </div>
                      </div>

                      <!-- Code Example -->
                      <div class="bg-gray-900 rounded-lg overflow-hidden mt-6">
                        <button @click="toggleCodeExample('jobs')"
                          class="w-full flex items-center justify-between bg-gray-800 px-4 py-2 hover:bg-gray-700 transition-colors">
                          <span class="text-gray-300 text-sm font-medium">Example Usage</span>
                          <svg
                            :class="['w-4 h-4 transition-transform text-gray-400', showCodeExample.jobs ? 'rotate-180' : '']"
                            fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7">
                            </path>
                          </svg>
                        </button>
                        <div v-show="showCodeExample.jobs" class="p-4">
                          <pre class="text-sm"><code class="text-green-400">import</code> <code class="text-blue-400">{ address }</code> <code class="text-green-400">from</code> <code class="text-yellow-400">'@nosana/kit'</code>

<code class="text-gray-500">// Get a specific job</code>
<code class="text-green-400">const</code> <code class="text-blue-400">jobAddress</code> <code class="text-white">=</code> <code class="text-yellow-400">'BwBURHTRMM3Ckzo2Dzmw99hv6gV8Ve12b6iw4sm9qeyR'</code>
<code class="text-green-400">const</code> <code class="text-blue-400">job</code> <code class="text-white">=</code> <code class="text-green-400">await</code> <code class="text-blue-400">client</code><code class="text-white">.</code><code class="text-blue-400">jobs</code><code class="text-white">.</code><code class="text-yellow-400">get</code><code class="text-white">(</code><code class="text-yellow-400">address</code><code class="text-white">(</code><code class="text-blue-400">jobAddress</code><code class="text-white">))</code>

<code class="text-gray-500">// Get all jobs with filters</code>
<code class="text-green-400">const</code> <code class="text-blue-400">runningJobs</code> <code class="text-white">=</code> <code class="text-green-400">await</code> <code class="text-blue-400">client</code><code class="text-white">.</code><code class="text-blue-400">jobs</code><code class="text-white">.</code><code class="text-yellow-400">all</code><code class="text-white">({</code>
  <code class="text-blue-400">state</code><code class="text-white">:</code> <code class="text-orange-400">2</code><code class="text-gray-500">, // Completed</code>
  <code class="text-blue-400">market</code><code class="text-white">:</code> <code class="text-yellow-400">'MarketAddress123...'</code>
<code class="text-white">})</code></pre>
                        </div>
                      </div>

                      <!-- Job States Reference -->
                      <div class="mt-6">
                        <h5 class="font-semibold text-gray-900 mb-4">Job State Reference</h5>
                        <div class="grid grid-cols-2 gap-3">
                          <div class="bg-yellow-50 border border-yellow-200 p-3 rounded-lg text-center">
                            <div class="text-2xl mb-1">🟡</div>
                            <div class="font-semibold text-yellow-900">Queued</div>
                            <div class="text-xs text-yellow-700">State: 0</div>
                          </div>
                          <div class="bg-blue-50 border border-blue-200 p-3 rounded-lg text-center">
                            <div class="text-2xl mb-1">🔵</div>
                            <div class="font-semibold text-blue-900">Running</div>
                            <div class="text-xs text-blue-700">State: 1</div>
                          </div>
                          <div class="bg-green-50 border border-green-200 p-3 rounded-lg text-center">
                            <div class="text-2xl mb-1">🟢</div>
                            <div class="font-semibold text-green-900">Done</div>
                            <div class="text-xs text-green-700">State: 2</div>
                          </div>
                          <div class="bg-red-50 border border-red-200 p-3 rounded-lg text-center">
                            <div class="text-2xl mb-1">🔴</div>
                            <div class="font-semibold text-red-900">Stopped</div>
                            <div class="text-xs text-red-700">State: 3</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Interactive Controls -->
                  <div class="lg:col-span-1">
                    <div class="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-6 sticky top-24">
                      <h4 class="font-semibold text-gray-900 mb-4">🎮 Try It Now</h4>

                      <div class="space-y-6">
                        <!-- Get Single Job -->
                        <div class="bg-white rounded-lg p-4 border border-green-200">
                          <label class="block text-sm font-semibold text-gray-700 mb-2">
                            🔍 Get Job by Address
                          </label>
                          <input v-model="jobAddress" type="text" placeholder="Job address..."
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent mb-3" />
                          <button @click="getJob" :disabled="loading || !jobAddress"
                            class="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium text-sm shadow-lg hover:shadow-xl">
                            <span v-if="loading" class="flex items-center justify-center">
                              <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor"
                                  stroke-width="4"></circle>
                                <path class="opacity-75" fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                                </path>
                              </svg>
                              Loading...
                            </span>
                            <span v-else>🔍 Get Job</span>
                          </button>
                        </div>

                        <!-- Get Multiple Jobs -->
                        <div class="bg-white rounded-lg p-4 border border-green-200">
                          <label class="block text-sm font-semibold text-gray-700 mb-2">
                            📋 Get Jobs with Filters
                          </label>
                          <select v-model="jobFilters.state"
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent mb-2">
                            <option value="">Any State</option>
                            <option value="0">🟡 Queued</option>
                            <option value="1">🔵 Running</option>
                            <option value="2">🟢 Done</option>
                            <option value="3">🔴 Stopped</option>
                          </select>
                          <input v-model="jobFilters.market" type="text" placeholder="Market Address (optional)"
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent mb-2" />
                          <input v-model="jobFilters.node" type="text" placeholder="Node Address (optional)"
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent mb-2" />
                          <input v-model="jobFilters.project" type="text" placeholder="Project Address (optional)"
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent mb-3" />
                          <button @click="getAllJobs" :disabled="loading"
                            class="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium text-sm shadow-lg hover:shadow-xl">
                            <span v-if="loading" class="flex items-center justify-center">
                              <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor"
                                  stroke-width="4"></circle>
                                <path class="opacity-75" fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                                </path>
                              </svg>
                              Fetching...
                            </span>
                            <span v-else>📋 Get Jobs</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 3. Market Discovery -->
            <div id="market-discovery" class="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
              <div class="bg-gradient-to-r from-orange-500 to-orange-600 px-8 py-6">
                <div class="flex items-center justify-between">
                  <h2 class="text-2xl font-bold text-white">🏪 Market Discovery</h2>
                  <span class="bg-white/20 px-3 py-1 rounded-full text-sm text-orange-100">Markets API</span>
                </div>
              </div>

              <div class="p-8">
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <!-- Documentation -->
                  <div class="lg:col-span-2">
                    <div class="prose prose-orange max-w-none">
                      <h4 class="text-xl font-semibold text-gray-900 mb-4">📚 Documentation</h4>

                      <!-- Method Signature -->
                      <div class="bg-gray-50 rounded-lg p-4 mb-6">
                        <div class="flex items-center justify-between mb-3">
                          <h5 class="font-semibold text-gray-700">Get All Markets</h5>
                          <span class="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">async</span>
                        </div>
                        <code class="text-sm font-mono text-purple-600 block mb-3">
                          client.jobs.markets(): Promise&lt;Market[]&gt;
                        </code>
                        <p class="text-gray-700 text-sm">
                          Retrieve all available compute markets with pricing and configuration details.
                        </p>
                      </div>

                      <!-- TypeScript Types -->
                      <div class="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-4 mb-6">
                        <button @click="toggleTypeInfo('markets')"
                          class="flex items-center justify-between w-full text-left">
                          <h5 class="font-semibold text-orange-900">🔍 TypeScript Types</h5>
                          <svg :class="['w-4 h-4 transition-transform', showTypeInfo.markets ? 'rotate-180' : '']"
                            fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7">
                            </path>
                          </svg>
                        </button>
                        <div v-show="showTypeInfo.markets" class="mt-4 space-y-3">
                          <div class="bg-white rounded p-3 text-sm font-mono">
                            <div class="text-blue-600">interface</div>
                            <div class="text-purple-600">Market</div>
                            <div class="ml-4 text-gray-600">address: string</div>
                            <div class="ml-4 text-gray-600">authority: Address</div>
                            <div class="ml-4 text-gray-600">jobExpiration: number</div>
                            <div class="ml-4 text-gray-600">jobPrice: number</div>
                            <div class="ml-4 text-gray-600">jobTimeout: number</div>
                            <div class="ml-4 text-gray-600">jobType: number</div>
                            <div class="ml-4 text-gray-600">vault: Address</div>
                            <div class="ml-4 text-gray-600">vaultBump: number</div>
                            <div class="ml-4 text-gray-600">nodeAccessKey: Address</div>
                            <div class="ml-4 text-gray-600">nodeXnosMinimum: number</div>
                            <div class="ml-4 text-gray-600">queueType: number</div>
                            <div class="ml-4 text-gray-600">queue: Address[]</div>
                          </div>
                        </div>
                      </div>

                      <!-- Code Example -->
                      <div class="bg-gray-900 rounded-lg overflow-hidden mb-6">
                        <button @click="toggleCodeExample('markets')"
                          class="w-full flex items-center justify-between bg-gray-800 px-4 py-2 hover:bg-gray-700 transition-colors">
                          <span class="text-gray-300 text-sm font-medium">Example Usage</span>
                          <svg
                            :class="['w-4 h-4 transition-transform text-gray-400', showCodeExample.markets ? 'rotate-180' : '']"
                            fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7">
                            </path>
                          </svg>
                        </button>
                        <div v-show="showCodeExample.markets" class="p-4">
                          <pre
                            class="text-sm"><code class="text-gray-500">// Get all available markets</code>
<code class="text-green-400">const</code> <code class="text-blue-400">markets</code> <code class="text-white">=</code> <code class="text-green-400">await</code> <code class="text-blue-400">client</code><code class="text-white">.</code><code class="text-blue-400">jobs</code><code class="text-white">.</code><code class="text-yellow-400">markets</code><code class="text-white">()</code>

<code class="text-gray-500">// Find cheapest market</code>
<code class="text-green-400">const</code> <code class="text-blue-400">cheapest</code> <code class="text-white">=</code> <code class="text-blue-400">markets</code><code class="text-white">.</code><code class="text-yellow-400">reduce</code><code class="text-white">((</code><code class="text-blue-400">min</code><code class="text-white">,</code> <code class="text-blue-400">market</code><code class="text-white">) =></code>
  <code class="text-blue-400">market</code><code class="text-white">.</code><code class="text-blue-400">jobPrice</code> <code class="text-white">&lt;</code> <code class="text-blue-400">min</code><code class="text-white">.</code><code class="text-blue-400">jobPrice</code> <code class="text-white">?</code> <code class="text-blue-400">market</code> <code class="text-white">:</code> <code class="text-blue-400">min</code>
<code class="text-white">)</code>

<code class="text-gray-500">// Filter by timeout</code>
<code class="text-green-400">const</code> <code class="text-blue-400">fastMarkets</code> <code class="text-white">=</code> <code class="text-blue-400">markets</code><code class="text-white">.</code><code class="text-yellow-400">filter</code><code class="text-white">(</code><code class="text-blue-400">m</code> <code class="text-white">=></code> <code class="text-blue-400">m</code><code class="text-white">.</code><code class="text-blue-400">jobTimeout</code> <code class="text-white">&lt;</code> <code class="text-orange-400">300</code><code class="text-white">)</code></pre>
                        </div>
                      </div>

                      <!-- Market Info -->
                      <div class="bg-orange-50 border-l-4 border-orange-400 p-4 rounded">
                        <h6 class="font-semibold text-orange-900 mb-2">💡 Market Insights</h6>
                        <p class="text-orange-800 text-sm mb-2">
                          Markets represent different compute environments with varying pricing, timeouts, and node
                          requirements.
                        </p>
                        <ul class="text-orange-700 text-sm space-y-1">
                          <li>• <strong>Job Price:</strong> Cost in lamports per job execution</li>
                          <li>• <strong>Job Timeout:</strong> Maximum execution time in seconds</li>
                          <li>• <strong>Job Expiration:</strong> How long jobs remain in queue</li>
                          <li>• <strong>Node Access Key:</strong> Required key for node participation</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <!-- Interactive Controls -->
                  <div class="lg:col-span-1">
                    <div class="bg-gradient-to-br from-orange-50 to-red-100 rounded-xl p-6 sticky top-24">
                      <h4 class="font-semibold text-gray-900 mb-4">🎮 Try It Now</h4>

                      <div class="bg-white rounded-lg p-4 border border-orange-200">
                        <div class="text-center mb-4">
                          <div class="text-3xl mb-2">🏪</div>
                          <p class="text-sm text-gray-600 mb-3">
                            Discover all available compute markets and their pricing models.
                          </p>
                        </div>
                        <button @click="getMarkets" :disabled="loading"
                          class="w-full px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-lg hover:shadow-xl">
                          <span v-if="loading" class="flex items-center justify-center">
                            <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4">
                              </circle>
                              <path class="opacity-75" fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                              </path>
                            </svg>
                            Loading...
                          </span>
                          <span v-else>🏪 Get Markets</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 4. Real-time Monitoring -->
            <div id="monitoring" class="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
              <div class="bg-gradient-to-r from-purple-500 to-purple-600 px-8 py-6">
                <div class="flex items-center justify-between">
                  <h2 class="text-2xl font-bold text-white">📡 Real-time Monitoring</h2>
                  <span class="bg-white/20 px-3 py-1 rounded-full text-sm text-purple-100">Monitor API</span>
                </div>
              </div>

              <div class="p-8">
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <!-- Documentation -->
                  <div class="lg:col-span-2">
                    <div class="prose prose-purple max-w-none">
                      <h4 class="text-xl font-semibold text-gray-900 mb-4">📚 Documentation</h4>

                      <!-- Method Signature -->
                      <div class="bg-gray-50 rounded-lg p-4 mb-6">
                        <div class="flex items-center justify-between mb-3">
                          <h5 class="font-semibold text-gray-700">Monitor Blockchain Events</h5>
                          <span class="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">async</span>
                        </div>
                        <code class="text-sm font-mono text-purple-600 block mb-3">
                          client.jobs.monitor(callbacks: MonitorCallbacks): Promise&lt;() => void&gt;
                        </code>
                        <p class="text-gray-700 text-sm">
                          Start real-time monitoring of blockchain events for jobs, runs, and markets.
                        </p>
                      </div>

                      <!-- TypeScript Types -->
                      <div class="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-4 mb-6">
                        <button @click="toggleTypeInfo('monitoring')"
                          class="flex items-center justify-between w-full text-left">
                          <h5 class="font-semibold text-purple-900">🔍 TypeScript Types</h5>
                          <svg :class="['w-4 h-4 transition-transform', showTypeInfo.monitoring ? 'rotate-180' : '']"
                            fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7">
                            </path>
                          </svg>
                        </button>
                        <div v-show="showTypeInfo.monitoring" class="mt-4 space-y-3">
                          <div class="bg-white rounded p-3 text-sm font-mono">
                            <div class="text-blue-600">interface</div>
                            <div class="text-purple-600">MonitorCallbacks</div>
                            <div class="ml-4 text-gray-600">onJobAccount?: (job: Job) => Promise&lt;void&gt;</div>
                            <div class="ml-4 text-gray-600">onRunAccount?: (run: Run) => Promise&lt;void&gt;</div>
                            <div class="ml-4 text-gray-600">onMarketAccount?: (market: Market) => Promise&lt;void&gt;
                            </div>
                            <div class="ml-4 text-gray-600">onError?: (error: Error, type: string) =>
                              Promise&lt;void&gt;</div>
                          </div>
                        </div>
                      </div>

                      <!-- Code Example -->
                      <div class="bg-gray-900 rounded-lg overflow-hidden mb-6">
                        <button @click="toggleCodeExample('monitoring')"
                          class="w-full flex items-center justify-between bg-gray-800 px-4 py-2 hover:bg-gray-700 transition-colors">
                          <span class="text-gray-300 text-sm font-medium">Example Usage</span>
                          <svg
                            :class="['w-4 h-4 transition-transform text-gray-400', showCodeExample.monitoring ? 'rotate-180' : '']"
                            fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7">
                            </path>
                          </svg>
                        </button>
                        <div v-show="showCodeExample.monitoring" class="p-4">
                          <pre class="text-sm"><code class="text-gray-500">// Start monitoring with callbacks</code>
<code class="text-green-400">const</code> <code class="text-blue-400">stopMonitoring</code> <code class="text-white">=</code> <code class="text-green-400">await</code> <code class="text-blue-400">client</code><code class="text-white">.</code><code class="text-blue-400">jobs</code><code class="text-white">.</code><code class="text-yellow-400">monitor</code><code class="text-white">({</code>
  <code class="text-blue-400">onJobAccount</code><code class="text-white">:</code> <code class="text-green-400">async</code> <code class="text-white">(</code><code class="text-blue-400">job</code><code class="text-white">) =></code> <code class="text-white">{</code>
    <code class="text-blue-400">console</code><code class="text-white">.</code><code class="text-yellow-400">log</code><code class="text-white">(</code><code class="text-yellow-400">'Job updated:'</code><code class="text-white">,</code> <code class="text-blue-400">job</code><code class="text-white">.</code><code class="text-blue-400">address</code><code class="text-white">)</code>
  <code class="text-white">},</code>
  <code class="text-blue-400">onRunAccount</code><code class="text-white">:</code> <code class="text-green-400">async</code> <code class="text-white">(</code><code class="text-blue-400">run</code><code class="text-white">) =></code> <code class="text-white">{</code>
    <code class="text-blue-400">console</code><code class="text-white">.</code><code class="text-yellow-400">log</code><code class="text-white">(</code><code class="text-yellow-400">'Run updated:'</code><code class="text-white">,</code> <code class="text-blue-400">run</code><code class="text-white">.</code><code class="text-blue-400">address</code><code class="text-white">)</code>
  <code class="text-white">},</code>
  <code class="text-blue-400">onError</code><code class="text-white">:</code> <code class="text-green-400">async</code> <code class="text-white">(</code><code class="text-blue-400">error</code><code class="text-white">) =></code> <code class="text-white">{</code>
    <code class="text-blue-400">console</code><code class="text-white">.</code><code class="text-red-400">error</code><code class="text-white">(</code><code class="text-yellow-400">'Monitor error:'</code><code class="text-white">,</code> <code class="text-blue-400">error</code><code class="text-white">)</code>
  <code class="text-white">}</code>
<code class="text-white">})</code>

<code class="text-gray-500">// Stop monitoring when done</code>
<code class="text-blue-400">stopMonitoring</code><code class="text-white">()</code></pre>
                        </div>
                      </div>

                      <!-- Monitor Info -->
                      <div class="bg-purple-50 border-l-4 border-purple-400 p-4 rounded">
                        <h6 class="font-semibold text-purple-900 mb-2">⚡ Real-time Updates</h6>
                        <p class="text-purple-800 text-sm mb-2">
                          Monitor blockchain events in real-time to track job progress, run status, and market changes.
                        </p>
                        <ul class="text-purple-700 text-sm space-y-1">
                          <li>• <strong>Job Events:</strong> State changes, node assignments, completions</li>
                          <li>• <strong>Run Events:</strong> Execution start/stop, result updates</li>
                          <li>• <strong>Market Events:</strong> Price changes, configuration updates</li>
                          <li>• <strong>Error Handling:</strong> Connection issues, parsing errors</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <!-- Interactive Controls -->
                  <div class="lg:col-span-1">
                    <div class="bg-gradient-to-br from-purple-50 to-indigo-100 rounded-xl p-6 sticky top-24">
                      <h4 class="font-semibold text-gray-900 mb-4">🎮 Try It Now</h4>

                      <div class="space-y-4">
                        <div class="bg-white rounded-lg p-4 border border-purple-200">
                          <div class="flex items-center justify-between mb-3">
                            <span class="text-sm font-semibold text-gray-700">
                              Monitor Status
                            </span>
                            <div class="flex items-center">
                              <div :class="[
                                'w-3 h-3 rounded-full mr-2',
                                isMonitoring ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                              ]"></div>
                              <span class="text-sm font-medium"
                                :class="isMonitoring ? 'text-green-700' : 'text-gray-600'">
                                {{ isMonitoring ? 'Active' : 'Inactive' }}
                              </span>
                            </div>
                          </div>

                          <div class="text-center mb-4">
                            <div class="text-3xl mb-2">{{ isMonitoring ? '📡' : '📴' }}</div>
                            <p class="text-xs text-gray-500">
                              {{ isMonitoring ? 'Watching for blockchain events' : 'Ready to start monitoring' }}
                            </p>
                          </div>

                          <button @click="toggleMonitoring" :disabled="loading" :class="[
                            'w-full px-4 py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-lg hover:shadow-xl',
                            isMonitoring
                              ? 'bg-red-600 text-white hover:bg-red-700'
                              : 'bg-purple-600 text-white hover:bg-purple-700'
                          ]">
                            <span v-if="loading" class="flex items-center justify-center">
                              <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor"
                                  stroke-width="4"></circle>
                                <path class="opacity-75" fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                                </path>
                              </svg>
                              Processing...
                            </span>
                            <span v-else>
                              {{ isMonitoring ? '🛑 Stop Monitoring' : '🚀 Start Monitoring' }}
                            </span>
                          </button>

                          <p class="text-xs text-gray-500 mt-3 text-center">
                            Monitor real-time blockchain events and see updates in the terminal
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Terminal Output - Right Sidebar -->
        <div :class="[
          'transition-all duration-300',
          isFullscreenTerminal ? 'fixed inset-0 z-50' : 'lg:col-span-5'
        ]">
          <div :class="[
            'shadow-lg flex flex-col',
            isFullscreenTerminal
              ? 'bg-gray-900 h-full w-full'
              : 'bg-white rounded-xl sticky top-24 max-h-[80vh] border border-gray-100'
          ]">
            <div class="bg-gradient-to-r from-gray-800 to-gray-900 px-6 py-4 flex items-center justify-between"
              :class="isFullscreenTerminal ? 'rounded-none' : 'rounded-t-xl'">
              <div class="flex items-center space-x-3">
                <!-- <div class="flex space-x-1">
                  <div class="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div class="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div class="w-3 h-3 bg-green-500 rounded-full"></div>
                </div> -->
                <h3 class="text-white font-semibold">💻 Terminal Output</h3>
              </div>
              <div class="flex items-center space-x-3">
                <span class="text-gray-300 text-sm">{{ logs.length }} lines</span>
                <button @click="autoScroll = !autoScroll" :class="[
                  'px-3 py-1 text-xs rounded-full transition-all duration-200',
                  autoScroll ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-200'
                ]">
                  Auto: {{ autoScroll ? 'ON' : 'OFF' }}
                </button>
                <button @click="toggleFullscreenTerminal"
                  class="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                  :title="isFullscreenTerminal ? 'Exit Fullscreen' : 'Enter Fullscreen'">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="isFullscreenTerminal
                      ? 'M9 9l6 6m0-6l-6 6M21 3l-6 6m0 0V4m0 5h5M3 21l6-6m0 0v5m0-5H4'
                      : 'M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4'">
                    </path>
                  </svg>
                </button>
              </div>
            </div>

            <div ref="terminal" :class="[
              'terminal flex-1 overflow-y-auto overflow-x-auto p-6',
              isFullscreenTerminal ? 'min-h-[calc(100vh-8.3rem)]' : 'min-h-[400px] max-h-[400px]'
            ]">
              <div v-for="(log, index) in logs" :key="index" class="terminal-line whitespace-nowrap mb-2">
                <span class="terminal-timestamp">{{ log.timestamp }}</span>
                <span :class="getLogClass(log.type)">{{ log.message }}</span>
              </div>
              <div v-if="logs.length === 0" class="text-gray-400 italic text-center mt-12">
                <div class="text-4xl mb-4">💻</div>
                <p class="text-lg font-medium mb-2">Terminal Ready</p>
                <p class="text-sm">Output will appear here when you test the API methods</p>
              </div>
            </div>

            <div class="p-4 border-t border-gray-200 bg-gray-50"
              :class="isFullscreenTerminal ? 'rounded-none' : 'rounded-b-xl'">
              <div class="flex space-x-2">
                <button @click="clearLogs"
                  class="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm transition-all duration-200 font-medium shadow-lg hover:shadow-xl">
                  🗑️ Clear Terminal
                </button>
                <button @click="exportLogs"
                  class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm transition-all duration-200 font-medium shadow-lg hover:shadow-xl">
                  💾 Export
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
const { NosanaClient, NosanaNetwork, address } = await import('@nosana/kit')
// Reactive state
const selectedNetwork = ref('mainnet')
const isConnected = ref(false)
const loading = ref(false)
const jobAddress = ref()
const jobFilters = ref({
  state: '',
  market: '',
  node: '',
  project: ''
})
const isMonitoring = ref(false)
const autoScroll = ref(true)
const logs = ref([])
const terminal = ref(null)
const isFullscreenTerminal = ref(false)

// Wallet state
const currentWallet = ref(null)
const walletInputMethod = ref('paste')
const walletInputs = ref({
  privateKey: '',
  fileContent: null
})
const fileInput = ref(null)

// Documentation visibility
const showTypeInfo = ref({
  init: false,
  jobs: false,
  markets: false,
  monitoring: false
})
const showCodeExample = ref({
  init: false,
  jobs: false,
  markets: false,
  monitoring: false
})

// SDK client
let client = null
let stopMonitoring = null

// Computed properties
const canSetWallet = computed(() => {
  switch (walletInputMethod.value) {
    case 'paste':
      return walletInputs.value.privateKey.trim().length > 0
    case 'file':
      return walletInputs.value.fileContent !== null
    default:
      return false
  }
})

// Log types
const LogType = {
  INFO: 'info',
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning'
}

// Utility functions
const addLog = (message, type = LogType.INFO) => {
  const timestamp = new Date().toLocaleTimeString()
  logs.value.push({ timestamp, message, type })

  // Always auto-scroll to bottom if autoScroll is enabled
  nextTick(() => {
    if (terminal.value && autoScroll.value) {
      terminal.value.scrollTop = terminal.value.scrollHeight
    }
  })
}

const getLogClass = (type) => {
  switch (type) {
    case LogType.ERROR: return 'terminal-error'
    case LogType.SUCCESS: return 'terminal-success'
    case LogType.WARNING: return 'terminal-warning'
    default: return 'terminal-info'
  }
}

const clearLogs = () => {
  logs.value = []
  addLog('Logs cleared', LogType.INFO)
}

const exportLogs = () => {
  const logText = logs.value.map(log => `[${log.timestamp}] ${log.message}`).join('\n')
  const blob = new Blob([logText], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `nosana-kit-logs-${new Date().toISOString().slice(0, 10)}.txt`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  addLog('📁 Logs exported to file', LogType.SUCCESS)
}

const copyInstallCommand = () => {
  navigator.clipboard.writeText('npm install @nosana/kit')
  addLog('📋 Installation command copied to clipboard', LogType.SUCCESS)
}

const toggleFullscreenTerminal = () => {
  isFullscreenTerminal.value = !isFullscreenTerminal.value
  addLog(`🖥️ Terminal ${isFullscreenTerminal.value ? 'expanded to' : 'exited'} fullscreen`, LogType.INFO)
}

const toggleTypeInfo = (section) => {
  showTypeInfo.value[section] = !showTypeInfo.value[section]
}

const toggleCodeExample = (section) => {
  showCodeExample.value[section] = !showCodeExample.value[section]
}

const scrollToSection = (sectionId) => {
  const element = document.getElementById(sectionId)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    addLog(`📍 Navigated to ${sectionId} section`, LogType.INFO)
  }
}

const scrollToTerminal = () => {
  if (terminal.value) {
    terminal.value.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

// Wallet operations
const handleFileUpload = (event) => {
  const file = event.target.files[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target.result
        JSON.parse(content) // Validate JSON
        walletInputs.value.fileContent = content
        addLog(`📁 File loaded: ${file.name}`, LogType.SUCCESS)
      } catch (error) {
        addLog(`❌ Invalid JSON file: ${error.message}`, LogType.ERROR)
        walletInputs.value.fileContent = null
        if (fileInput.value) {
          fileInput.value.value = ''
        }
      }
    }
    reader.readAsText(file)
  }
}

const setWallet = async () => {
  if (!client) {
    addLog('❌ SDK not initialized', LogType.ERROR)
    scrollToTerminal()
    return
  }

  try {
    loading.value = true

    let walletData
    let inputType = 'unknown'

    switch (walletInputMethod.value) {
      case 'paste':
        walletData = walletInputs.value.privateKey.trim()
        // Try to detect the format for better logging
        if (walletData.startsWith('[') && walletData.endsWith(']')) {
          inputType = 'JSON array'
        } else if (walletData.includes(',') && !walletData.includes('[')) {
          inputType = 'number array'
        } else if (walletData.length > 80 && !walletData.includes(',')) {
          inputType = 'Base58'
        } else {
          inputType = 'auto-detected format'
        }
        break
      case 'file':
        walletData = walletInputs.value.fileContent
        inputType = 'keypair file'
        break
      default:
        throw new Error('Invalid wallet input method')
    }

    addLog(`🔐 Setting wallet from ${inputType}...`, LogType.INFO)
    scrollToTerminal()

    const wallet = await client.setWallet(walletData)

    if (wallet && wallet.address) {
      currentWallet.value = wallet.address
      addLog(`✅ Wallet set successfully!`, LogType.SUCCESS)
      addLog(`📍 Address: ${wallet.address}`, LogType.INFO)
      addLog(`🔍 Detected format: ${inputType}`, LogType.INFO)
    } else {
      throw new Error('Wallet set but no address returned')
    }

  } catch (error) {
    addLog(`❌ Failed to set wallet: ${error.message}`, LogType.ERROR)
    currentWallet.value = null
  } finally {
    loading.value = false
  }
}

const clearWallet = () => {
  currentWallet.value = null
  client.wallet = undefined
  addLog('🗑️ Wallet cleared', LogType.INFO)
  scrollToTerminal()
}

const loadDemoKeypair = () => {
  const demoKeypair = '[66,240,117,68,169,30,179,62,57,123,28,249,122,218,186,173,196,222,208,58,126,168,32,91,126,64,102,33,220,51,49,97,6,197,228,206,210,117,23,184,89,48,217,110,194,137,242,129,112,23,140,120,148,249,210,18,105,192,40,197,250,132,40,149]'

  walletInputMethod.value = 'paste'
  walletInputs.value.privateKey = demoKeypair
}

// SDK operations
const initializeClient = async () => {
  try {
    // Stop monitoring if active before switching networks
    if (isMonitoring.value) {
      if (stopMonitoring) {
        stopMonitoring()
        stopMonitoring = null
      }
      isMonitoring.value = false
      addLog('🛑 Stopped monitoring due to network switch', LogType.WARNING)
    }

    // Clear wallet when switching networks
    if (currentWallet.value) {
      currentWallet.value = null
      addLog('🔐 Wallet cleared due to network switch', LogType.WARNING)
    }

    loading.value = true
    addLog(`Initializing Nosana SDK for ${selectedNetwork.value}...`, LogType.INFO)

    const network = selectedNetwork.value === 'mainnet'
      ? NosanaNetwork.MAINNET
      : NosanaNetwork.DEVNET

    client = new NosanaClient(network)
    isConnected.value = true

    addLog(`✅ SDK initialized successfully for ${selectedNetwork.value}`, LogType.SUCCESS)
    addLog(`📡 RPC Endpoint: ${client.config.solana.rpcEndpoint}`, LogType.INFO)
    addLog(`🏪 Jobs Program: ${client.config.programs.jobsAddress}`, LogType.INFO)

  } catch (error) {
    addLog(`❌ Failed to initialize SDK: ${error.message}`, LogType.ERROR)
    isConnected.value = false
  } finally {
    loading.value = false
  }
}

const testConnection = async () => {
  if (!client) {
    addLog('❌ SDK not initialized', LogType.ERROR)
    scrollToTerminal()
    return
  }

  try {
    loading.value = true
    addLog('🔍 Testing connection...', LogType.INFO)
    scrollToTerminal()

    // Test by getting the latest blockhash
    const latestBlockhash = await client.solana.getLatestBlockhash()
    addLog(`✅ Connection successful! Latest blockhash: ${latestBlockhash.blockhash}`, LogType.SUCCESS)

  } catch (error) {
    addLog(`❌ Connection test failed: ${error.message}`, LogType.ERROR)
  } finally {
    loading.value = false
  }
}

const getJob = async () => {
  if (!client || !jobAddress.value) {
    addLog('❌ SDK not initialized or no job address provided', LogType.ERROR)
    scrollToTerminal()
    return
  }

  try {
    loading.value = true
    addLog(`🔍 Fetching job: ${jobAddress.value}`, LogType.INFO)
    scrollToTerminal()

    const job = await client.jobs.get(address(jobAddress.value))

    addLog(`✅ Job retrieved successfully!`, LogType.SUCCESS)
    addLog(`📋 Job Details:`, LogType.INFO)
    addLog(`   Address: ${job.address}`, LogType.INFO)
    addLog(`   State: ${getJobStateName(job.state)}`, LogType.INFO)
    addLog(`   Market: ${job.market}`, LogType.INFO)
    addLog(`   Price: ${job.price}`, LogType.INFO)
    addLog(`   IPFS Job: ${job.ipfsJob}`, LogType.INFO)
    if (job.node) addLog(`   Node: ${job.node}`, LogType.INFO)
    if (job.timeStart) addLog(`   Start Time: ${new Date(job.timeStart * 1000).toLocaleString()}`, LogType.INFO)

  } catch (error) {
    addLog(`❌ Failed to fetch job: ${error.message}`, LogType.ERROR)
  } finally {
    loading.value = false
  }
}

const getAllJobs = async () => {
  if (!client) {
    addLog('❌ SDK not initialized', LogType.ERROR)
    scrollToTerminal()
    return
  }

  try {
    loading.value = true
    addLog('🔍 Fetching jobs with filters...', LogType.INFO)
    scrollToTerminal()

    const filters = {}
    if (jobFilters.value.state !== '') {
      filters.state = parseInt(jobFilters.value.state)
    }
    if (jobFilters.value.market !== '') {
      filters.market = address(jobFilters.value.market)
    }
    if (jobFilters.value.node !== '') {
      filters.node = address(jobFilters.value.node)
    }
    if (jobFilters.value.project !== '') {
      filters.project = address(jobFilters.value.project)
    }
    const jobs = await client.jobs.all(filters)
    // Show first 20 jobs to avoid overwhelming the terminal
    const limitedJobs = jobs.slice(0, 20)

    addLog(`✅ Retrieved ${limitedJobs.length} jobs (total: ${jobs.length})`, LogType.SUCCESS)

    limitedJobs.forEach((job, index) => {
      addLog(`📋 Job ${index + 1}:`, LogType.INFO)
      addLog(job, LogType.INFO)
    })

  } catch (error) {
    addLog(`❌ Failed to fetch jobs: ${error.message}`, LogType.ERROR)
  } finally {
    loading.value = false
  }
}

const getMarkets = async () => {
  if (!client) {
    addLog('❌ SDK not initialized', LogType.ERROR)
    scrollToTerminal()
    return
  }

  try {
    loading.value = true
    addLog('🔍 Fetching all markets...', LogType.INFO)
    scrollToTerminal()

    const markets = await client.jobs.markets()

    addLog(`✅ Retrieved ${markets.length} markets`, LogType.SUCCESS)

    markets.forEach((market, index) => {
      addLog(`🏪 Market ${index + 1}:`, LogType.INFO)
      addLog(market, LogType.INFO)
    })

  } catch (error) {
    addLog(`❌ Failed to fetch markets: ${error.message}`, LogType.ERROR)
  } finally {
    loading.value = false
  }
}

const toggleMonitoring = async () => {
  if (!client) {
    addLog('❌ SDK not initialized', LogType.ERROR)
    scrollToTerminal()
    return
  }

  if (isMonitoring.value) {
    // Stop monitoring
    if (stopMonitoring) {
      stopMonitoring()
      stopMonitoring = null
    }
    isMonitoring.value = false
    addLog('🛑 Stopped monitoring account updates', LogType.WARNING)
    scrollToTerminal()
  } else {
    // Start monitoring
    try {
      loading.value = true
      addLog('🚀 Starting real-time monitoring...', LogType.INFO)
      scrollToTerminal()

      stopMonitoring = await client.jobs.monitor({
        onJobAccount: async (jobAccount) => {
          addLog(`🔄 Job account updated: ${jobAccount.address}`, LogType.SUCCESS)
          addLog(`   State: ${getJobStateName(jobAccount.state)}`, LogType.INFO)
          if (jobAccount.node) addLog(`   Node: ${jobAccount.node}`, LogType.INFO)
        },

        onRunAccount: async (runAccount) => {
          addLog(`🏃 Run account updated: ${runAccount.address}`, LogType.SUCCESS)
          addLog(`   Job: ${runAccount.job}`, LogType.INFO)
          addLog(`   Node: ${runAccount.node}`, LogType.INFO)
        },

        onMarketAccount: async (marketAccount) => {
          addLog(`🏪 Market account updated: ${marketAccount.address}`, LogType.SUCCESS)
          addLog(`   Job Price: ${marketAccount.jobPrice}`, LogType.INFO)
        },

        onError: async (error, accountType) => {
          addLog(`❌ Monitor error (${accountType}): ${error.message}`, LogType.ERROR)
        }
      })

      isMonitoring.value = true
      addLog('✅ Real-time monitoring started successfully!', LogType.SUCCESS)
      addLog('👀 Watching for job, run, and market account updates...', LogType.INFO)

    } catch (error) {
      addLog(`❌ Failed to start monitoring: ${error.message}`, LogType.ERROR)
    } finally {
      loading.value = false
    }
  }
}

const getJobStateName = (state) => {
  const states = {
    0: 'Queued',
    1: 'Running',
    2: 'Done',
    3: 'Stopped'
  }
  return states[state] || `Unknown (${state})`
}

// Initialize on mount
onMounted(() => {
  addLog('🚀 Nosana SDK Playground initialized', LogType.SUCCESS)
  addLog('📚 This is an interactive documentation and testing environment', LogType.INFO)
  addLog('🔧 Use the controls on the left to test SDK functionality', LogType.INFO)
  initializeClient()
})
</script>

<style scoped>
.terminal {
  background-color: #1a1a1a;
  border-radius: 6px;
  padding: 16px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

.terminal-line {
  margin-bottom: 8px;
  line-height: 1.4;
}

.terminal-timestamp {
  color: #6b7280;
  font-size: 12px;
  margin-right: 8px;
}

.terminal-info {
  color: #e5e7eb;
}

.terminal-success {
  color: #10b981;
  font-weight: 500;
}

.terminal-error {
  color: #ef4444;
  font-weight: 500;
}

.terminal-warning {
  color: #f59e0b;
  font-weight: 500;
}

/* Scrollbar styling */
.terminal::-webkit-scrollbar {
  width: 8px;
}

.terminal::-webkit-scrollbar-track {
  background: #374151;
  border-radius: 4px;
}

.terminal::-webkit-scrollbar-thumb {
  background: #6b7280;
  border-radius: 4px;
}

.terminal::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}

/* Code blocks */
pre code {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  line-height: 1.5;
}

/* Tab transitions */
.tab-content {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Enhanced buttons */
button:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* Loading states */
.loading-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.5;
  }
}

/* Status indicators */
.status-indicator {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* Documentation section styling */
.prose {
  max-width: none;
}

.prose h3 {
  margin-top: 2rem;
  margin-bottom: 1rem;
}

.prose p {
  margin-bottom: 1rem;
}

.prose ul {
  margin-bottom: 1rem;
}

.prose li {
  margin-bottom: 0.5rem;
}

.terminal {
  background-color: #1a202c;
  color: #68d391;
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace;
  font-size: 0.875rem;
  padding: 1rem;
  border-radius: 0.5rem;
  overflow: auto;
  scrollbar-width: thin;
  scrollbar-color: #4a5568 #1a202c;
}

.terminal::-webkit-scrollbar {
  width: 8px;
}

.terminal::-webkit-scrollbar-track {
  background: #1a202c;
}

.terminal::-webkit-scrollbar-thumb {
  background: #4a5568;
  border-radius: 4px;
}

.terminal::-webkit-scrollbar-thumb:hover {
  background: #718096;
}

.terminal-line {
  margin-bottom: 0.25rem;
}

.terminal-timestamp {
  color: #9ca3af;
  margin-right: 0.5rem;
}

.terminal-error {
  color: #f87171;
}

.terminal-success {
  color: #68d391;
}

.terminal-info {
  color: #60a5fa;
}

.terminal-warning {
  color: #fbbf24;
}
</style>
