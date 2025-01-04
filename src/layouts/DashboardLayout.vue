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
                <div class="flex-1">
                    <div v-for="item in menuItems" :key="item.key" class="nav-item"
                        :class="{ active: selectedKeys.includes(item.key) }"
                        @click="handleMenuClick({ key: item.key })">
                        <component :is="item.icon" class="text-xl mb-1" />
                        <span class="text-xs">{{ item.text }}</span>
                    </div>
                </div>
                <!-- 退出登录按钮 -->
                <div class="nav-item cursor-pointer hover:bg-dark-300" @click="handleLogout">
                    <poweroff-outlined class="text-xl mb-1" />
                    <span class="text-xs">退出</span>
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
    WalletOutlined,
    RobotOutlined,
    OrderedListOutlined,
    PoweroffOutlined
} from '@ant-design/icons-vue'
import { storage } from '@/utils/storage'
import { useCurrencyStore } from '@/store/currency'
import PreferenceSettings from '@/components/PreferenceSettings.vue'

const PATH_TO_KEY = {
    '/dashboard/overview': 'dashboard',
    '/dashboard/trade': 'trade',
    '/dashboard/assets': 'assets',
    '/dashboard/quant': 'quant',
    '/dashboard/orders': 'orders'
}

const KEY_TO_PATH = {
    'dashboard': '/dashboard/overview',
    'trade': '/dashboard/trade',
    'assets': '/dashboard/assets',
    'quant': '/dashboard/quant',
    'orders': '/dashboard/orders'
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
        RobotOutlined,
        OrderedListOutlined,
        PoweroffOutlined,
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
                key: 'orders',
                icon: OrderedListOutlined,
                text: '订单'
            },
            {
                key: 'assets',
                icon: WalletOutlined,
                text: '资产'
            },
            {
                key: 'quant',
                icon: RobotOutlined,
                text: '量化'
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
            // 清除配置并跳转到登录页
            storage.clearApiConfig()
            router.push('/')
            window.location.href = '/'
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

/* 深色主题样式 */
body[data-theme="dark"] {
    .ant-dropdown {
        .ant-dropdown-menu {
            background: var(--bg-secondary);
            border: 1px solid var(--border-color);
        }

        .ant-dropdown-menu-item {
            .menu-item-content {

                .anticon,
                span {
                    color: var(--text-color);
                }
            }

            &:hover {
                background-color: var(--bg-hover);

                .menu-item-content {

                    .anticon,
                    span {
                        color: var(--primary-color);
                    }
                }
            }
        }

        .ant-dropdown-menu-item-divider {
            background-color: var(--border-color);
        }
    }
}

/* 浅色主题样式 */
body[data-theme="light"] {
    .ant-dropdown {
        .ant-dropdown-menu {
            background: var(--bg-color);
            border: 1px solid var(--border-color);
        }

        .ant-dropdown-menu-item {
            .menu-item-content {

                .anticon,
                span {
                    color: var(--text-color);
                }
            }

            &:hover {
                background-color: var(--bg-hover);

                .menu-item-content {

                    .anticon,
                    span {
                        color: var(--primary-color);
                    }
                }
            }
        }

        .ant-dropdown-menu-item-divider {
            background-color: var(--border-color);
        }
    }
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