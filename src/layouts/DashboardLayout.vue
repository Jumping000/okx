<template>
    <div class="h-screen flex flex-col bg-dark-500 text-white overflow-hidden">
        <!-- 顶部栏 -->
        <header class="h-12 min-h-[48px] bg-dark-400 px-4 flex justify-between items-center border-b border-dark-300">
            <div class="logo">
                <h1 class="m-0 text-lg font-medium text-primary tracking-wide">OKX</h1>
            </div>
            <div class="flex items-center gap-6">
                <!-- 消息通知 -->
                <a-dropdown placement="bottomRight" :trigger="['hover']">
                    <div class="relative cursor-pointer">
                        <bell-outlined class="text-xl bell-icon translate-y-[-2px]" />
                        <span v-if="unreadCount > 0" 
                            class="absolute -top-0 -right-0 w-2 h-2 rounded-full bg-red-500 translate-y-[2px]">
                        </span>
                    </div>
                    <template #overlay>
                        <a-card class="message-dropdown" :bordered="false">
                            <template #title>
                                <div class="flex justify-between items-center py-2 px-4 border-b border-[var(--border-color)]">
                                    <span class="text-sm font-medium notification-title">消息通知</span>
                                    <div class="flex items-center gap-2">
                                        <a-tooltip title="全部标记为已读" placement="bottom">
                                            <a-button type="text" size="small" @click="markAllRead" class="icon-btn">
                                                <template #icon><check-outlined /></template>
                                            </a-button>
                                        </a-tooltip>
                                        <a-tooltip title="清空全部消息" placement="bottom">
                                            <a-button type="text" size="small" @click="clearAllMessages" class="icon-btn">
                                                <template #icon><delete-outlined /></template>
                                            </a-button>
                                        </a-tooltip>
                                    </div>
                                </div>
                            </template>
                            <a-tabs class="message-tabs">
                                <a-tab-pane key="all" tab="全部">
                                    <div class="message-list">
                                        <template v-if="messages.length">
                                            <div v-for="msg in messages" :key="msg.id" 
                                                class="message-item" 
                                                :class="{ 'unread': !msg.read }"
                                                @click="showMessageDetail(msg)">
                                                <div class="flex items-start gap-3 relative">
                                                    <div class="flex-1 min-w-0">
                                                        <div class="message-title truncate">{{ msg.title }}</div>
                                                        <div class="message-content line-clamp-2">{{ msg.content }}</div>
                                                        <div class="message-time">{{ msg.time }}</div>
                                                    </div>
                                                    <div v-if="!msg.read" class="unread-dot"></div>
                                                </div>
                                            </div>
                                        </template>
                                        <div v-else class="empty-message">
                                            <inbox-outlined class="text-4xl opacity-20 mb-2" />
                                            <span>暂无消息</span>
                                        </div>
                                    </div>
                                </a-tab-pane>
                                <a-tab-pane key="system" tab="系统">
                                    <div class="message-list">
                                        <template v-if="systemMessages.length">
                                            <div v-for="msg in systemMessages" :key="msg.id" 
                                                class="message-item" 
                                                :class="{ 'unread': !msg.read }"
                                                @click="showMessageDetail(msg)">
                                                <div class="flex items-start gap-3 relative">
                                                    <div class="flex-1 min-w-0">
                                                        <div class="message-title truncate">{{ msg.title }}</div>
                                                        <div class="message-content line-clamp-2">{{ msg.content }}</div>
                                                        <div class="message-time">{{ msg.time }}</div>
                                                    </div>
                                                    <div v-if="!msg.read" class="unread-dot"></div>
                                                </div>
                                            </div>
                                        </template>
                                        <div v-else class="empty-message">
                                            <inbox-outlined class="text-4xl opacity-20 mb-2" />
                                            <span>暂无系统消息</span>
                                        </div>
                                    </div>
                                </a-tab-pane>
                                <a-tab-pane key="trade" tab="交易">
                                    <div class="message-list">
                                        <template v-if="tradeMessages.length">
                                            <div v-for="msg in tradeMessages" :key="msg.id" 
                                                class="message-item" 
                                                :class="{ 'unread': !msg.read }"
                                                @click="showMessageDetail(msg)">
                                                <div class="flex items-start gap-3 relative">
                                                    <div class="flex-1 min-w-0">
                                                        <div class="message-title truncate">{{ msg.title }}</div>
                                                        <div class="message-content line-clamp-2">{{ msg.content }}</div>
                                                        <div class="message-time">{{ msg.time }}</div>
                                                    </div>
                                                    <div v-if="!msg.read" class="unread-dot"></div>
                                                </div>
                                            </div>
                                        </template>
                                        <div v-else class="empty-message">
                                            <inbox-outlined class="text-4xl opacity-20 mb-2" />
                                            <span>暂无交易消息</span>
                                        </div>
                                    </div>
                                </a-tab-pane>
                            </a-tabs>
                        </a-card>
                    </template>
                </a-dropdown>
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
                <!-- 反馈按钮 -->
                <div class="nav-item nav-item-bottom" @click="showFeedbackModal">
                    <comment-outlined class="text-xl mb-1" />
                    <span class="text-xs">反馈</span>
                </div>
                <!-- 退出登录按钮 -->
                <div class="nav-item nav-item-bottom" @click="handleLogout">
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

        <!-- 反馈弹窗 -->
        <a-modal
            v-model:visible="feedbackVisible"
            title="问题反馈"
            @ok="handleFeedbackSubmit"
            @cancel="handleFeedbackCancel"
            :confirmLoading="feedbackLoading"
        >
            <a-form :model="feedbackForm" layout="vertical">
                <a-form-item
                    label="问题类型"
                    name="type"
                    :rules="[{ required: true, message: '请选择问题类型' }]"
                >
                    <a-select v-model:value="feedbackForm.type" placeholder="请选择问题类型">
                        <a-select-option value="bug">功能异常</a-select-option>
                        <a-select-option value="suggestion">功能建议</a-select-option>
                        <a-select-option value="question">使用疑问</a-select-option>
                        <a-select-option value="other">其他</a-select-option>
                    </a-select>
                </a-form-item>
                <a-form-item
                    label="问题描述"
                    name="content"
                    :rules="[{ required: true, message: '请输入问题描述' }]"
                >
                    <a-textarea
                        v-model:value="feedbackForm.content"
                        :rows="4"
                        placeholder="请详细描述您遇到的问题或建议..."
                    />
                </a-form-item>
                <a-form-item label="联系方式" name="contact">
                    <a-input
                        v-model:value="feedbackForm.contact"
                        placeholder="请留下您的联系方式（选填）"
                    />
                </a-form-item>
            </a-form>
        </a-modal>

        <!-- 消息详情模态框 -->
        <a-modal
            v-model:visible="messageDetailVisible"
            :title="selectedMessage?.title"
            @ok="closeMessageDetail"
            :footer="null"
            class="message-detail-modal"
        >
            <template #title>
                <div class="flex items-center gap-2">
                    <span>{{ selectedMessage?.title }}</span>
                    <a-tag :color="getMessageTypeColor(selectedMessage?.type)">
                        {{ getMessageTypeText(selectedMessage?.type) }}
                    </a-tag>
                </div>
            </template>
            <div class="message-detail-content">
                <div class="message-time">
                    发布时间：{{ formatMessageTime(selectedMessage?.time) }}
                </div>
                <div class="message-content">
                    {{ selectedMessage?.content }}
                </div>
            </div>
        </a-modal>
    </div>
</template>

<script>
import { defineComponent, ref, watch, onMounted, computed } from 'vue'
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
    PoweroffOutlined,
    CommentOutlined,
    BellOutlined,
    CheckOutlined,
    DeleteOutlined,
    InboxOutlined
} from '@ant-design/icons-vue'
import { storage } from '@/utils/storage'
import { useCurrencyStore } from '@/store/currency'
import PreferenceSettings from '@/components/PreferenceSettings.vue'
import { useUserStore } from '@/store/modules/user'
import { message } from 'ant-design-vue'
import dayjs from 'dayjs'

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
        PreferenceSettings,
        CommentOutlined,
        BellOutlined,
        CheckOutlined,
        DeleteOutlined,
        InboxOutlined
    },
    setup() {
        const router = useRouter()
        const route = useRoute()
        const selectedKeys = ref([PATH_TO_KEY[route.path] || 'dashboard'])
        const currencyStore = useCurrencyStore()
        const preferencesRef = ref(null)
        const userStore = useUserStore()

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
            userStore.logout()
            message.success('退出登录成功')
            router.push('/auth/login')
        }

        const openSettings = () => {
            preferencesRef.value?.showModal()
        }

        // 反馈相关
        const feedbackVisible = ref(false)
        const feedbackLoading = ref(false)
        const feedbackForm = ref({
            type: undefined,
            content: '',
            contact: ''
        })

        // 显示反馈弹窗
        const showFeedbackModal = () => {
            feedbackVisible.value = true
        }

        // 提交反馈
        const handleFeedbackSubmit = () => {
            if (!feedbackForm.value.type || !feedbackForm.value.content) {
                message.error('请填写必填项')
                return
            }

            feedbackLoading.value = true
            // 这里模拟提交反馈
            setTimeout(() => {
                message.success('感谢您的反馈！')
                feedbackLoading.value = false
                feedbackVisible.value = false
                // 重置表单
                feedbackForm.value = {
                    type: undefined,
                    content: '',
                    contact: ''
                }
            }, 1000)
        }

        // 取消反馈
        const handleFeedbackCancel = () => {
            feedbackVisible.value = false
            // 重置表单
            feedbackForm.value = {
                type: undefined,
                content: '',
                contact: ''
            }
        }

        const messages = ref([
            {
                id: 1,
                title: '系统通知',
                content: '您的API密钥即将过期，请及时更新',
                time: '10分钟前',
                read: false,
                type: 'system'
            },
            {
                id: 2,
                title: '交易提醒',
                content: 'BTC-USDT 触发止盈订单',
                time: '30分钟前',
                read: true,
                type: 'trade'
            }
        ])

        const systemMessages = computed(() => {
            return messages.value.filter(msg => msg.type === 'system')
        })

        const tradeMessages = computed(() => {
            return messages.value.filter(msg => msg.type === 'trade')
        })

        const unreadCount = computed(() => {
            return messages.value.filter(msg => !msg.read).length
        })

        // 消息详情相关
        const messageDetailVisible = ref(false)
        const selectedMessage = ref(null)

        // 获取消息类型颜色
        const getMessageTypeColor = (type) => {
            const colors = {
                system: 'blue',
                trade: 'green',
                risk: 'red',
                maintenance: 'orange'
            }
            return colors[type] || 'default'
        }

        // 获取消息类型文本
        const getMessageTypeText = (type) => {
            const texts = {
                system: '系统消息',
                trade: '交易提醒',
                risk: '风险提示',
                maintenance: '系统维护'
            }
            return texts[type] || type
        }

        // 格式化消息时间
        const formatMessageTime = (time) => {
            if (!time) return ''
            return dayjs(time).format('YYYY-MM-DD HH:mm:ss')
        }

        // 显示消息详情
        const showMessageDetail = (message) => {
            selectedMessage.value = message
            messageDetailVisible.value = true
            if (!message.read) {
                readMessage(message)
            }
        }

        // 关闭消息详情
        const closeMessageDetail = () => {
            messageDetailVisible.value = false
            selectedMessage.value = null
        }

        // 更新readMessage方法
        const readMessage = (message) => {
            message.read = true
            showMessageDetail(message)
        }

        const markAllRead = () => {
            messages.value.forEach(msg => {
                msg.read = true
            })
        }

        const clearAllMessages = () => {
            messages.value = []
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
            openSettings,
            feedbackVisible,
            feedbackLoading,
            feedbackForm,
            showFeedbackModal,
            handleFeedbackSubmit,
            handleFeedbackCancel,
            messages,
            systemMessages,
            tradeMessages,
            unreadCount,
            readMessage,
            markAllRead,
            clearAllMessages,
            messageDetailVisible,
            selectedMessage,
            getMessageTypeColor,
            getMessageTypeText,
            formatMessageTime,
            showMessageDetail,
            closeMessageDetail,
        }
    }
})
</script>

<style lang="scss" scoped>
.user-dropdown-menu {
    min-width: 140px;
}

/* 深色主题样式 */
body[data-theme="dark"] {
    .h-screen {
        @apply bg-dark-500;
    }

    header {
        @apply bg-dark-400 border-dark-300;
    }

    aside {
        @apply bg-dark-400 border-dark-300;
    }

    main {
        @apply bg-dark-500;
    }

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
    }

    /* 弹窗样式 */
    :deep(.ant-modal-content) {
        @apply bg-dark-400 border border-dark-300;

        .ant-modal-header {
            @apply bg-dark-400 border-b border-dark-300;
        }

        .ant-modal-title {
            @apply text-dark-100;
        }

        .ant-modal-body {
            @apply text-dark-100;
        }

        .ant-modal-footer {
            @apply bg-dark-400 border-t border-dark-300;
        }

        .ant-btn {
            @apply bg-dark-400 border-dark-300 text-dark-100;
            &:hover {
                @apply border-primary text-primary;
            }
            &.ant-btn-primary {
                @apply bg-primary border-primary text-white;
                &:hover {
                    @apply bg-primary/90;
                }
            }
        }
    }

    /* 消息通知图标样式 */
    .icon-btn {
        :deep(.anticon) {
            color: rgba(255, 255, 255, 0.85);
            transition: color 0.3s;
            
            &:hover {
                color: var(--primary-color);
            }
        }
    }
}

/* 浅色主题样式 */
body[data-theme="light"] {
    .h-screen {
        @apply bg-white;
    }

    header {
        @apply bg-white border-gray-200;
        .text-dark-100 {
            @apply text-gray-700;
        }
        .text-dark-200 {
            @apply text-gray-500;
        }

        /* 修改小铃铛图标颜色 */
        .bell-icon {
            @apply text-gray-700;
        }

        /* 消息通知文字颜色 */
        .message-title {
            @apply text-gray-700;
        }
    }

    aside {
        @apply bg-white border-gray-200;
    }

    main {
        @apply bg-gray-50;
    }

    .ant-dropdown {
        .ant-dropdown-menu {
            @apply bg-white border border-gray-200;
        }

        .ant-dropdown-menu-item {
            .menu-item-content {
                .anticon,
                span {
                    @apply text-gray-700;
                }
            }

            &:hover {
                @apply bg-gray-50;

                .menu-item-content {
                    .anticon,
                    span {
                        @apply text-primary;
                    }
                }
            }
        }
    }

    /* 弹窗样式 */
    :deep(.ant-modal-content) {
        @apply bg-white border border-gray-200;

        .ant-modal-header {
            @apply bg-white border-b border-gray-200;
        }

        .ant-modal-title {
            @apply text-gray-900;
        }

        .ant-modal-body {
            @apply text-gray-700;
        }

        .ant-modal-footer {
            @apply bg-white border-t border-gray-200;
        }

        .ant-btn {
            @apply bg-white border-gray-300 text-gray-700;
            &:hover {
                @apply border-primary text-primary;
            }
            &.ant-btn-primary {
                @apply bg-primary border-primary text-white;
                &:hover {
                    @apply bg-primary/90;
                }
            }
        }
    }

    /* 消息通知图标样式 */
    .icon-btn {
        :deep(.anticon) {
            color: rgba(0, 0, 0, 0.65);
            transition: color 0.3s;
            
            &:hover {
                color: var(--primary-color);
            }
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

.dashboard-layout {
    min-height: 100vh;
}

.dashboard-sider {
    .logo {
        height: 64px;
        padding: 16px;
        display: flex;
        align-items: center;
        gap: 8px;
        overflow: hidden;
        background-color: var(--menu-dark-bg);

        img {
            height: 32px;
            width: 32px;
        }

        span {
            color: white;
            font-size: 16px;
            font-weight: 600;
            white-space: nowrap;
            opacity: 1;
            transition: opacity 0.2s;
        }
    }
}

.dashboard-header {
    background: #fff;
    padding: 0;

    .trigger {
        padding: 0 24px;
        font-size: 18px;
        line-height: 64px;
        cursor: pointer;
        transition: color 0.3s;

        &:hover {
            color: var(--primary-color);
        }
    }
}

.dashboard-content {
    margin: 24px 16px;
    padding: 24px;
    background: #fff;
    min-height: 280px;
}

/* 导航项基础样式 */
.nav-item {
    @apply flex flex-col items-center justify-center py-3 text-dark-100 transition-colors;
    cursor: pointer;
}

/* 暗色主题导航样式 */
body[data-theme="dark"] {
    .nav-item {
        &:hover {
            @apply bg-dark-300;
            .anticon {
                @apply text-primary;
            }
            span {
                @apply text-primary;
            }
        }

        &.active {
            @apply text-primary;
            .anticon {
                @apply text-primary;
            }
            span {
                @apply text-primary;
            }
        }
    }
}

/* 亮色主题导航样式 */
body[data-theme="light"] {
    .nav-item {
        @apply text-gray-600;
        
        &:hover {
            background-color: rgba(0, 0, 0, 0.04);
            .anticon {
                @apply text-primary;
            }
            span {
                @apply text-primary;
            }
        }

        &.active {
            @apply text-primary;
            .anticon {
                @apply text-primary;
            }
            span {
                @apply text-primary;
            }
        }
    }
}

/* 底部按钮组样式 */
.nav-item-bottom {
    @apply mt-2;
}

/* 消息下拉框样式优化 */
.message-dropdown {
    width: 360px;
    max-height: 480px;
    overflow: hidden;
    border-radius: 8px;
    box-shadow: var(--shadow-lg);
    transition: all 0.3s ease;
    
    :deep(.ant-card-body) {
        padding: 0;
    }

    :deep(.ant-tabs) {
        overflow: hidden;
    }
    
    :deep(.ant-tabs-nav) {
        margin: 0;
        padding: 0 16px;
        background: var(--bg-secondary);
        border-bottom: 1px solid var(--border-color);
    }

    :deep(.ant-tabs-content) {
        height: 360px;
        background: var(--bg-color);
    }
    
    .message-list {
        height: 100%;
        overflow-y: auto;
        
        &::-webkit-scrollbar {
            width: 4px;
        }
        
        &::-webkit-scrollbar-thumb {
            background-color: var(--scrollbar-thumb);
            border-radius: 2px;
            
            &:hover {
                background-color: var(--scrollbar-thumb-hover);
            }
        }
        
        &::-webkit-scrollbar-track {
            background-color: var(--scrollbar-track);
        }
    }
    
    .message-item {
        padding: 12px 16px;
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        border-bottom: 1px solid var(--border-color);
        position: relative;
        
        &::after {
            content: '';
            position: absolute;
            left: 0;
            top: 0;
            width: 0;
            height: 100%;
            background-color: var(--primary-color);
            opacity: 0.1;
            transition: width 0.3s ease;
        }
        
        &:hover {
            background-color: var(--item-hover-bg);
            
            &::after {
                width: 4px;
            }
            
            .message-title {
                color: var(--primary-color);
            }
        }
        
        &.unread {
            background-color: var(--item-unread-bg);
            
            .message-title {
                font-weight: 600;
            }
        }
        
        .message-title {
            font-size: 14px;
            color: var(--text-color);
            margin-bottom: 4px;
            transition: color 0.2s ease;
        }
        
        .message-content {
            font-size: 13px;
            color: var(--text-secondary);
            margin-bottom: 4px;
            line-height: 1.5;
        }
        
        .message-time {
            font-size: 12px;
            color: var(--text-tertiary);
        }
        
        .unread-dot {
            position: absolute;
            right: 0;
            top: 2px;
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background-color: var(--primary-color);
            transition: transform 0.2s ease;
            
            &:hover {
                transform: scale(1.2);
            }
        }
    }
    
    .empty-message {
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: var(--text-secondary);
        font-size: 14px;
        padding: 24px;
        
        .anticon {
            font-size: 48px;
            margin-bottom: 16px;
            color: var(--text-tertiary);
            opacity: 0.5;
            transition: all 0.3s ease;
            
            &:hover {
                opacity: 0.8;
                transform: scale(1.1);
            }
        }
    }
}

/* 消息详情模态框样式优化 */
.message-detail-modal {
    :deep(.ant-modal-content) {
        background-color: var(--bg-color);
        border: 1px solid var(--border-color);
        border-radius: 12px;
        box-shadow: var(--shadow-lg);
        overflow: hidden;
        transition: all 0.3s ease;

        .ant-modal-header {
            background-color: var(--bg-secondary);
            border-bottom: 1px solid var(--border-color);
            padding: 20px 24px;

            .ant-modal-title {
                color: var(--text-color);
                font-size: 16px;
                font-weight: 600;
                
                .ant-tag {
                    margin-left: 8px;
                    font-weight: normal;
                    transition: all 0.3s ease;
                    
                    &:hover {
                        transform: translateY(-1px);
                    }
                }
            }
        }

        .ant-modal-body {
            padding: 24px;
            background: var(--bg-color);
            
            .message-detail-content {
                .message-time {
                    color: var(--text-tertiary);
                    font-size: 13px;
                    margin-bottom: 16px;
                }
                
                .message-content {
                    color: var(--text-color);
                    font-size: 14px;
                    line-height: 1.6;
                }
            }
        }

        .ant-modal-close {
            color: var(--text-secondary);
            transition: all 0.3s ease;

            &:hover {
                color: var(--primary-color);
                transform: rotate(90deg);
            }
        }
    }
}

/* 主题变量定义 */
body[data-theme="dark"] {
    .message-dropdown {
        --scrollbar-thumb: rgba(255, 255, 255, 0.2);
        --scrollbar-thumb-hover: rgba(255, 255, 255, 0.3);
        --scrollbar-track: rgba(255, 255, 255, 0.05);
        --item-hover-bg: rgba(255, 255, 255, 0.04);
        --item-unread-bg: rgba(var(--primary-color-rgb), 0.08);
        --border-color: rgba(255, 255, 255, 0.08);
        --shadow-lg: 0 4px 20px rgba(0, 0, 0, 0.5);
        
        :deep(.ant-tabs-tab) {
            color: rgba(255, 255, 255, 0.65);
            transition: color 0.3s ease;
            
            &:hover {
                color: rgba(255, 255, 255, 0.85);
            }
            
            &.ant-tabs-tab-active {
                color: var(--primary-color);
                font-weight: 500;
            }
        }
        
        :deep(.ant-tabs-ink-bar) {
            display: none;
        }
    }
}

body[data-theme="light"] {
    .message-dropdown {
        --scrollbar-thumb: rgba(0, 0, 0, 0.15);
        --scrollbar-thumb-hover: rgba(0, 0, 0, 0.25);
        --scrollbar-track: rgba(0, 0, 0, 0.03);
        --item-hover-bg: rgba(0, 0, 0, 0.02);
        --item-unread-bg: rgba(var(--primary-color-rgb), 0.04);
        --border-color: rgba(0, 0, 0, 0.06);
        --shadow-lg: 0 4px 20px rgba(0, 0, 0, 0.08);
        
        :deep(.ant-tabs-tab) {
            color: rgba(0, 0, 0, 0.65);
            transition: color 0.3s ease;
            
            &:hover {
                color: rgba(0, 0, 0, 0.85);
            }
            
            &.ant-tabs-tab-active {
                color: var(--primary-color);
                font-weight: 500;
            }
        }
        
        :deep(.ant-tabs-ink-bar) {
            display: none;
        }
    }
}

/* 动画效果 */
@keyframes slideIn {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.message-dropdown {
    animation: slideIn 0.3s ease;
}

.message-item {
    animation: slideIn 0.3s ease;
    animation-fill-mode: both;
    
    @for $i from 1 through 10 {
        &:nth-child(#{$i}) {
            animation-delay: #{$i * 0.05}s;
        }
    }
}

/* 消息通知标题样式 */
.notification-title {
    color: var(--text-color);
    transition: color 0.3s ease;
}

/* 深色主题样式 */
body[data-theme="dark"] {
    .notification-title {
        color: rgba(255, 255, 255, 0.85);
    }
}

/* 浅色主题样式 */
body[data-theme="light"] {
    .notification-title {
        color: rgba(0, 0, 0, 0.85);
    }
}
</style>

<style lang="scss">
/* 暗色主题样式 */
body[data-theme="dark"] {
    .ant-modal-content {
        .ant-form-item-label > label {
            color: #e5e7eb !important;
        }

        .ant-select:not(.ant-select-customize-input) .ant-select-selector {
            background-color: #1f2937 !important;
            border-color: #374151 !important;
            color: #e5e7eb !important;
        }

        .ant-select-arrow {
            color: #e5e7eb !important;
        }

        .ant-input,
        .ant-input-textarea textarea {
            background-color: #1f2937 !important;
            border-color: #374151 !important;
            color: #e5e7eb !important;

            &::placeholder {
                color: #6b7280 !important;
            }
        }
    }

    .ant-select-dropdown {
        background-color: #1f2937 !important;
        border: 1px solid #374151 !important;

        .ant-select-item {
            color: #e5e7eb !important;

            &:hover {
                background-color: #374151 !important;
            }

            &.ant-select-item-option-selected {
                background-color: #374151 !important;
                color: var(--ant-primary-color) !important;
            }
        }
    }

    .ant-modal-title {
        color: #e5e7eb !important;
    }
}

/* 亮色主题样式 */
body[data-theme="light"] {
    .ant-modal-content {
        .ant-form-item-label > label {
            color: rgba(0, 0, 0, 0.85) !important;
        }

        .ant-select:not(.ant-select-customize-input) .ant-select-selector {
            background-color: #ffffff !important;
            border-color: #d9d9d9 !important;
            color: rgba(0, 0, 0, 0.85) !important;
        }

        .ant-select-arrow {
            color: rgba(0, 0, 0, 0.25) !important;
        }

        .ant-input,
        .ant-input-textarea textarea {
            background-color: #ffffff !important;
            border-color: #d9d9d9 !important;
            color: rgba(0, 0, 0, 0.85) !important;

            &::placeholder {
                color: rgba(0, 0, 0, 0.25) !important;
            }
        }
    }

    .ant-select-dropdown {
        background-color: #ffffff !important;
        border: 1px solid #d9d9d9 !important;

        .ant-select-item {
            color: rgba(0, 0, 0, 0.85) !important;

            &:hover {
                background-color: #f5f5f5 !important;
            }

            &.ant-select-item-option-selected {
                background-color: #e6f7ff !important;
                color: var(--ant-primary-color) !important;
            }
        }
    }

    .ant-modal-title {
        color: rgba(0, 0, 0, 0.85) !important;
    }
}

/* 错误信息样式 - 通用 */
.ant-form-item-explain-error {
    color: #ff4d4f !important;
}
</style>