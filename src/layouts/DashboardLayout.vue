<template>
    <div class="h-screen flex flex-col bg-dark-500 text-white overflow-hidden">
        <!-- 顶部栏 -->
        <header class="h-12 min-h-[48px] bg-dark-400 px-4 flex justify-between items-center border-b border-dark-300">
            <div class="logo">
                <h1 class="m-0 text-lg font-medium text-primary tracking-wide">OKX</h1>
            </div>
            <div class="flex items-center gap-6">
                <div class="flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(0,185,107,0.5)]"></span>
                    <span class="text-xs text-dark-200">市场状态正常</span>
                </div>
                <a-dropdown>
                    <a
                        class="flex items-center gap-2 px-2 py-1 rounded cursor-pointer transition-colors hover:bg-white/[0.04]">
                        <a-avatar :size="28">U</a-avatar>
                        <span class="text-sm text-dark-100">用户名</span>
                        <down-outlined />
                    </a>
                    <template #overlay>
                        <a-menu class="bg-dark-400 border border-dark-300">
                            <a-menu-item key="settings">
                                <setting-outlined />
                                <span>偏好设置</span>
                            </a-menu-item>
                            <a-menu-divider />
                            <a-menu-item key="logout" @click="handleLogout">
                                <logout-outlined />
                                <span>退出登录</span>
                            </a-menu-item>
                        </a-menu>
                    </template>
                </a-dropdown>
            </div>
        </header>

        <!-- 主要内容区 -->
        <div class="flex-1 flex min-h-0 overflow-hidden">
            <!-- 左侧菜单 -->
            <aside class="w-20 min-w-[80px] bg-dark-400 border-r border-dark-300 flex flex-col py-3">
                <div v-for="item in menuItems" :key="item.key" class="nav-item"
                    :class="{ active: selectedKeys.includes(item.key) }" @click="handleMenuClick({ key: item.key })">
                    <component :is="item.icon" class="text-xl mb-1" />
                    <span class="text-xs">{{ item.text }}</span>
                </div>
            </aside>

            <!-- 右侧内容区 -->
            <main class="flex-1 relative min-w-0 bg-dark-500 overflow-hidden">
                <router-view v-slot="{ Component }">
                    <transition name="fade">
                        <component :is="Component" />
                    </transition>
                </router-view>
            </main>
        </div>
    </div>
</template>

<script>
import { defineComponent, ref, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
    DownOutlined,
    SettingOutlined,
    LogoutOutlined,
    DashboardOutlined,
    FundOutlined,
    WalletOutlined
} from '@ant-design/icons-vue'
import { storage } from '@/utils/storage'
import { useCurrencyStore } from '@/store/currency'

const PATH_TO_KEY = {
    '/dashboard/overview': 'dashboard',
    '/dashboard/trade': 'trade',
    '/dashboard/assets': 'assets'
}

const KEY_TO_PATH = {
    'dashboard': '/dashboard/overview',
    'trade': '/dashboard/trade',
    'assets': '/dashboard/assets'
}

export default defineComponent({
    name: 'DashboardLayout',
    components: {
        DownOutlined,
        SettingOutlined,
        LogoutOutlined,
        DashboardOutlined,
        FundOutlined,
        WalletOutlined
    },
    setup() {
        const router = useRouter()
        const route = useRoute()
        const selectedKeys = ref([PATH_TO_KEY[route.path] || 'dashboard'])
        const currencyStore = useCurrencyStore()

        const menuItems = [
            {
                key: 'dashboard',
                icon: DashboardOutlined,
                text: '概览'
            },
            {
                key: 'trade',
                icon: FundOutlined,
                text: '交易'
            },
            {
                key: 'assets',
                icon: WalletOutlined,
                text: '资产'
            }
        ]

        watch(
            () => route.path,
            (path) => {
                selectedKeys.value = [PATH_TO_KEY[path] || 'dashboard']
            }
        )

        const handleMenuClick = ({ key }) => {
            router.push(KEY_TO_PATH[key])
        }

        const handleLogout = () => {
            storage.clearApiConfig()
            router.push('/')
        }
        onMounted(async () => {

            // 获取币种列表

            await currencyStore.fetchCurrencies()

        })
        return {
            selectedKeys,
            menuItems,
            handleMenuClick,
            handleLogout
        }
    }
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}

:deep(.ant-dropdown-menu-item) {
    @apply text-dark-100 hover:bg-white/[0.04] !important;
}
</style>