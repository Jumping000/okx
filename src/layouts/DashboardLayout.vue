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
                        <a-menu class="user-dropdown-menu">
                            <a-menu-item key="settings" @click="openSettings">
                                <div class="menu-item-content">
                                    <setting-outlined />
                                    <span>偏好设置</span>
                                </div>
                            </a-menu-item>
                            <a-menu-item key="logout" @click="handleLogout">
                                <div class="menu-item-content">
                                    <logout-outlined />
                                    <span>退出登录</span>
                                </div>
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

        <!-- 偏好设置组件 -->
        <preference-settings ref="preferencesRef" />
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
import PreferenceSettings from '@/components/PreferenceSettings.vue'

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
        WalletOutlined,
        PreferenceSettings
    },
    setup() {
        const router = useRouter()
        const route = useRoute()
        const selectedKeys = ref([PATH_TO_KEY[route.path] || 'dashboard'])
        const currencyStore = useCurrencyStore()
        const preferencesRef = ref(null)

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

        const openSettings = () => {
            preferencesRef.value?.showModal()
        }

        onMounted(async () => {

            // 获取币种列表

            await currencyStore.fetchCurrencies()

        })
        return {
            selectedKeys,
            menuItems,
            handleMenuClick,
            handleLogout,
            preferencesRef,
            openSettings
        }
    }
})
</script>

<style scoped>
.user-dropdown-menu {
    min-width: 140px;
}

/* 浅色主题样式 */
:deep([data-theme="light"] .user-dropdown-menu) {
    background: #ffffff;
    border: 1px solid #e5e7eb;

    .ant-menu-item {
        .menu-item-content {

            .anticon,
            span {
                color: rgba(0, 0, 0, 0.85);
            }
        }

        &:hover {
            background-color: #f5f5f5;

            .menu-item-content {

                .anticon,
                span {
                    color: var(--primary-color);
                }
            }
        }
    }

    .ant-menu-item-divider {
        background-color: #e5e7eb;
    }
}

/* 深色主题样式 */
:deep([data-theme="dark"] .user-dropdown-menu) {
    background: #1a1d1e;
    border: 1px solid #2a2d2e;

    .ant-menu-item {
        .menu-item-content {

            .anticon,
            span {
                color: #ffffff;
            }
        }

        &:hover {
            background-color: #2a2d2e;

            .menu-item-content {

                .anticon,
                span {
                    color: var(--primary-color);
                }
            }
        }
    }

    .ant-menu-item-divider {
        background-color: #2a2d2e;
    }
}

.user-dropdown-menu :deep(.ant-menu-item) {
    @apply p-0;
    height: 32px;
    line-height: 32px;
    margin: 0;
}

.menu-item-content {
    @apply flex items-center gap-2 px-3;
    height: 100%;
}

.menu-item-content .anticon {
    @apply text-base;
}

.menu-item-content span {
    @apply text-sm;
}

:deep(.ant-menu-item-divider) {
    margin: 4px 0;
}

.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>