<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center py-6">
          <div class="flex items-center">
            <h1 class="text-3xl font-bold text-gray-900">Nosana SDK Playground</h1>
            <span class="ml-3 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
              Interactive Documentation
            </span>
          </div>
          <div class="flex items-center space-x-4">
            <select 
              v-model="selectedNetwork" 
              @change="initializeClient"
              class="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="mainnet">Mainnet</option>
              <option value="devnet">Devnet</option>
            </select>
            <div class="flex items-center">
              <div 
                :class="[
                  'w-2 h-2 rounded-full mr-2',
                  isConnected ? 'bg-green-500' : 'bg-red-500'
                ]"
              ></div>
              <span class="text-sm text-gray-600">
                {{ isConnected ? 'Connected' : 'Disconnected' }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Left Panel - Controls -->
        <div class="space-y-6">
          <!-- SDK Initialization -->
          <div class="bg-white rounded-lg shadow p-6">
            <h2 class="text-xl font-semibold text-gray-900 mb-4">SDK Initialization</h2>
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Network: {{ selectedNetwork.toUpperCase() }}
                </label>
                <p class="text-sm text-gray-600">
                  SDK initialized for {{ selectedNetwork }} network
                </p>
              </div>
              <button
                @click="testConnection"
                :disabled="loading"
                class="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {{ loading ? 'Testing...' : 'Test Connection' }}
              </button>
            </div>
          </div>

          <!-- Job Operations -->
          <div class="bg-white rounded-lg shadow p-6">
            <h2 class="text-xl font-semibold text-gray-900 mb-4">Job Operations</h2>
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Get Job by Address
                </label>
                <div class="flex space-x-2">
                  <input
                    v-model="jobAddress"
                    type="text"
                    placeholder="Enter job address..."
                    class="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    @click="getJob"
                    :disabled="loading || !jobAddress"
                    class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Get Job
                  </button>
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Get All Jobs with Filters
                </label>
                <div class="grid grid-cols-2 gap-2 mb-2">
                  <select
                    v-model="jobFilters.state"
                    class="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Any State</option>
                    <option value="0">Queued</option>
                    <option value="1">Running</option>
                    <option value="2">Stopped</option>
                    <option value="3">Done</option>
                  </select>
                  <input
                    v-model="jobFilters.limit"
                    type="number"
                    placeholder="Limit (default: 10)"
                    min="1"
                    max="100"
                    class="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  @click="getAllJobs"
                  :disabled="loading"
                  class="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Get Jobs
                </button>
              </div>
            </div>
          </div>

          <!-- Market Operations -->
          <div class="bg-white rounded-lg shadow p-6">
            <h2 class="text-xl font-semibold text-gray-900 mb-4">Market Operations</h2>
            <div class="space-y-4">
              <button
                @click="getMarkets"
                :disabled="loading"
                class="w-full px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Get All Markets
              </button>
            </div>
          </div>

          <!-- Monitor Operations -->
          <div class="bg-white rounded-lg shadow p-6">
            <h2 class="text-xl font-semibold text-gray-900 mb-4">Real-time Monitoring</h2>
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium text-gray-700">
                  Account Updates Monitor
                </span>
                <div class="flex items-center">
                  <div 
                    :class="[
                      'w-2 h-2 rounded-full mr-2',
                      isMonitoring ? 'bg-green-500' : 'bg-gray-400'
                    ]"
                  ></div>
                  <span class="text-sm text-gray-600">
                    {{ isMonitoring ? 'Active' : 'Inactive' }}
                  </span>
                </div>
              </div>
              <button
                @click="toggleMonitoring"
                :disabled="loading"
                :class="[
                  'w-full px-4 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed',
                  isMonitoring 
                    ? 'bg-red-600 text-white hover:bg-red-700' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                ]"
              >
                {{ isMonitoring ? 'Stop Monitoring' : 'Start Monitoring' }}
              </button>
              <p class="text-xs text-gray-500">
                Monitor real-time updates for jobs, runs, and markets
              </p>
            </div>
          </div>

          <!-- Clear Logs -->
          <div class="bg-white rounded-lg shadow p-6">
            <button
              @click="clearLogs"
              class="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Clear Logs
            </button>
          </div>
        </div>

        <!-- Right Panel - Terminal Output -->
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-semibold text-gray-900">Output Terminal</h2>
            <div class="flex items-center space-x-2">
              <span class="text-sm text-gray-500">{{ logs.length }} lines</span>
              <button
                @click="autoScroll = !autoScroll"
                :class="[
                  'px-2 py-1 text-xs rounded',
                  autoScroll ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                ]"
              >
                Auto-scroll: {{ autoScroll ? 'ON' : 'OFF' }}
              </button>
            </div>
          </div>
          <div ref="terminal" class="terminal">
            <div
              v-for="(log, index) in logs"
              :key="index"
              class="terminal-line"
            >
              <span class="terminal-timestamp">{{ log.timestamp }}</span>
              <span :class="getLogClass(log.type)">{{ log.message }}</span>
            </div>
            <div v-if="logs.length === 0" class="text-gray-500 italic">
              No logs yet. Try running some operations above.
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, watch } from 'vue'

// Reactive state
const selectedNetwork = ref('devnet')
const isConnected = ref(false)
const loading = ref(false)
const jobAddress = ref('BwBURHTRMM3Ckzo2Dzmw99hv6gV8Ve12b6iw4sm9qeyR')
const jobFilters = ref({
  state: '',
  limit: 10
})
const isMonitoring = ref(false)
const autoScroll = ref(true)
const logs = ref([])
const terminal = ref(null)

// SDK client
let client = null
let stopMonitoring = null

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
  
  if (autoScroll.value) {
    nextTick(() => {
      if (terminal.value) {
        terminal.value.scrollTop = terminal.value.scrollHeight
      }
    })
  }
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

// SDK operations
const initializeClient = async () => {
  try {
    loading.value = true
    addLog(`Initializing Nosana SDK for ${selectedNetwork.value}...`, LogType.INFO)
    
    // Dynamic import to avoid SSR issues
    const { NosanaClient, NosanaNetwork } = await import('@nosana/kit')
    
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
    return
  }
  
  try {
    loading.value = true
    addLog('🔍 Testing connection...', LogType.INFO)
    
    // Test by getting the latest blockhash
    const latestBlockhash = await client.solana.getLatestBlockhash()
    addLog(`✅ Connection successful! Latest blockhash: ${latestBlockhash.blockhash.slice(0, 8)}...`, LogType.SUCCESS)
    
  } catch (error) {
    addLog(`❌ Connection test failed: ${error.message}`, LogType.ERROR)
  } finally {
    loading.value = false
  }
}

const getJob = async () => {
  if (!client || !jobAddress.value) {
    addLog('❌ SDK not initialized or no job address provided', LogType.ERROR)
    return
  }
  
  try {
    loading.value = true
    addLog(`🔍 Fetching job: ${jobAddress.value}`, LogType.INFO)
    
    const { address } = await import('@nosana/kit')
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
    return
  }
  
  try {
    loading.value = true
    addLog('🔍 Fetching jobs with filters...', LogType.INFO)
    
    const filters = {}
    if (jobFilters.value.state !== '') {
      filters.state = parseInt(jobFilters.value.state)
    }
    
    const jobs = await client.jobs.all(filters)
    const limitedJobs = jobs.slice(0, jobFilters.value.limit || 10)
    
    addLog(`✅ Retrieved ${limitedJobs.length} jobs (total: ${jobs.length})`, LogType.SUCCESS)
    
    limitedJobs.forEach((job, index) => {
      addLog(`📋 Job ${index + 1}:`, LogType.INFO)
      addLog(`   Address: ${job.address}`, LogType.INFO)
      addLog(`   State: ${getJobStateName(job.state)}`, LogType.INFO)
      addLog(`   Price: ${job.price}`, LogType.INFO)
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
    return
  }
  
  try {
    loading.value = true
    addLog('🔍 Fetching all markets...', LogType.INFO)
    
    const markets = await client.jobs.markets()
    
    addLog(`✅ Retrieved ${markets.length} markets`, LogType.SUCCESS)
    
    markets.forEach((market, index) => {
      addLog(`🏪 Market ${index + 1}:`, LogType.INFO)
      addLog(`   Address: ${market.address}`, LogType.INFO)
      addLog(`   Job Expiration: ${market.jobExpiration}`, LogType.INFO)
      addLog(`   Job Price: ${market.jobPrice}`, LogType.INFO)
      addLog(`   Job Timeout: ${market.jobTimeout}`, LogType.INFO)
      addLog(`   Node Access Key: ${market.nodeAccessKey}`, LogType.INFO)
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
  } else {
    // Start monitoring
    try {
      loading.value = true
      addLog('🚀 Starting real-time monitoring...', LogType.INFO)
      
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
    2: 'Stopped',
    3: 'Done'
  }
  return states[state] || `Unknown (${state})`
}

// Watch for network changes
watch(selectedNetwork, () => {
  if (isMonitoring.value) {
    toggleMonitoring() // Stop monitoring before switching networks
  }
  initializeClient()
})

// Initialize on mount
onMounted(() => {
  addLog('🚀 Nosana SDK Playground initialized', LogType.SUCCESS)
  addLog('📚 This is an interactive documentation and testing environment', LogType.INFO)
  addLog('🔧 Use the controls on the left to test SDK functionality', LogType.INFO)
  initializeClient()
})
</script>
