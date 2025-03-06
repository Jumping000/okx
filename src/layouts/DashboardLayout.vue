<template>
    <div class="h-screen flex flex-col bg-dark-500 text-white overflow-hidden">
        <!-- 顶部栏 -->
        <header class="h-12 min-h-[48px] bg-dark-400 px-4 flex justify-between items-center border-b border-dark-300">
            <div class="logo">
                <h1 class="m-0 text-lg font-medium text-primary tracking-wide">OKX</h1>
            </div>
            <div class="flex items-center gap-6">
                <!-- 消息通知 -->
                <a-dropdown placement="bottomRight" :trigger="['hover']" @visibleChange="handleDropdownVisibleChange">
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
                            <div class="message-list">
                                <template v-if="messages.length">
                                    <div v-for="msg in messages" :key="msg.id" 
                                        class="message-item" 
                                        :class="{ 'unread': !msg.isRead }"
                                        @click="() => {
                                            readMessage(msg);
                                            showMessageDetail(msg);
                                        }">
                                        <div class="flex items-start gap-3 relative">
                                            <div class="flex-1 min-w-0">
                                                <div class="message-title truncate">{{ msg.title }}</div>
                                                <div class="message-content line-clamp-2">{{ msg.content }}</div>
                                                <div class="flex justify-between items-center">
                                                    <div class="message-time">{{ formatMessageTime(msg.time) }}</div>
                                                    <div class="message-status" :class="msg.isRead ? 'text-dark-200' : 'text-primary'">
                                                        {{ msg.isRead ? '已读' : '未读' }}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </template>
                                <div v-else class="empty-message">
                                    <inbox-outlined class="text-4xl opacity-20 mb-2" />
                                    <span>暂无消息</span>
                                </div>
                            </div>
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
                <div class="nav-item nav-item-bottom" @click="showFeedback">
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
            class="feedback-modal"
            :maskClosable="false"
            :keyboard="false"
            okText="提交反馈"
            cancelText="取消"
        >
            <template #title>
                <div class="flex items-center gap-2">
                    <comment-outlined />
                    <span>问题反馈</span>
                </div>
            </template>
            <a-form :model="feedbackForm" layout="vertical">
                <a-form-item
                    label="问题类型"
                    name="type"
                    :rules="[{ required: true, message: '请选择问题类型' }]"
                >
                    <a-select 
                        v-model:value="feedbackForm.type" 
                        placeholder="请选择问题类型"
                        :options="[
                            { value: 'bug', label: '功能异常' },
                            { value: 'feature', label: '功能建议' },
                            { value: 'other', label: '其他' }
                        ]"
                    />
                </a-form-item>
                <a-form-item
                    label="问题描述"
                    name="content"
                    :rules="[
                        { required: true, message: '请输入问题描述' },
                        { min: 10, message: '问题描述至少10个字符' },
                        { max: 500, message: '问题描述最多500个字符' }
                    ]"
                >
                    <a-textarea
                        v-model:value="feedbackForm.content"
                        :rows="4"
                        placeholder="请详细描述您遇到的问题或建议..."
                        :maxlength="500"
                        show-count
                    />
                </a-form-item>
                <a-form-item label="联系方式" name="contact">
                    <a-input
                        v-model:value="feedbackForm.contact"
                        placeholder="请留下您的联系方式（选填）"
                        :maxlength="50"
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
                    <span class="modal-title">{{ selectedMessage?.title }}</span>
                    <a-tag :color="getMessageTypeColor(selectedMessage?.type)">
                        {{ getMessageTypeText(selectedMessage?.type) }}
                    </a-tag>
                </div>
            </template>
            <div class="message-detail-content">
                <div class="message-time text-dark-200">
                    发布时间：{{ formatMessageTime(selectedMessage?.time) }}
                </div>
                <div class="message-content text-dark-100">
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
import { submitFeedback } from '@/api/feedback'
import { getUserMessages, markMessageRead, markAllMessagesRead, deleteMessage, getUnreadMessageCount } from '@/api/message'

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
            // storage.clearApiConfig()
            localStorage.removeItem('token');
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
            type: '',
            content: '',
            contact: ''
        })

        // 打开反馈弹窗
        const showFeedback = () => {
            feedbackVisible.value = true
        }

        // 关闭反馈弹窗
        const handleFeedbackCancel = () => {
            feedbackVisible.value = false
            feedbackForm.value = {
                type: '',
                content: '',
                contact: ''
            }
        }

        // 提交反馈
        const handleFeedbackSubmit = async () => {
            if (!feedbackForm.value.type || !feedbackForm.value.content) {
                message.error('请填写必填项')
                return
            }

            if (feedbackForm.value.content.length < 10) {
                message.error('问题描述至少10个字符')
                return
            }

            feedbackLoading.value = true
            try {
                const res = await submitFeedback({
                    type: feedbackForm.value.type,
                    content: feedbackForm.value.content,
                    contact: feedbackForm.value.contact || undefined  // 如果没有填写联系方式，则不传此字段
                })
                if (res.code === 200 && res.success) {
                    message.success('反馈提交成功')
                    handleFeedbackCancel()
                } else {
                    throw new Error(res.message || '提交失败')
                }
            } catch (error) {
                message.error(error.message || '提交失败')
            } finally {
                feedbackLoading.value = false
            }
        }

        const messages = ref([])
        const unreadCount = ref(0)
        const messageLoading = ref(false)

        // 获取消息列表
        const fetchMessages = async () => {
            messageLoading.value = true
            try {
                const res = await getUserMessages({
                    pageSize: 50  // 设置较大的pageSize以显示更多消息
                })
                if (res.success) {
                    messages.value = res.data.list.map(msg => ({
                        ...msg,
                        time: msg.createdAt
                    }))
                }
            } catch (error) {
                console.error('获取消息列表失败:', error)
            } finally {
                messageLoading.value = false
            }
        }

        // 获取未读消息数量
        const fetchUnreadCount = async () => {
            try {
                const res = await getUnreadMessageCount()
                if (res.success) {
                    unreadCount.value = res.data.count
                }
            } catch (error) {
                console.error('获取未读消息数量失败:', error)
            }
        }

        // 标记消息为已读
        const readMessage = async (message) => {
            if (!message.isRead) {
                try {
                    const res = await markMessageRead(message.id)
                    if (res.success) {
                        message.isRead = true
                        await fetchUnreadCount()
                    }
                } catch (error) {
                    console.error('标记消息已读失败:', error)
                }
            }
        }

        // 标记所有消息为已读
        const markAllRead = async () => {
            try {
                const res = await markAllMessagesRead()
                if (res.success) {
                    messages.value.forEach(msg => msg.isRead = true)
                    unreadCount.value = 0
                    message.success('已全部标记为已读')
                }
            } catch (error) {
                console.error('标记全部已读失败:', error)
                message.error('操作失败')
            }
        }

        // 清空全部消息
        const clearAllMessages = async () => {
            try {
                // 逐个删除消息
                await Promise.all(messages.value.map(msg => deleteMessage(msg.id)))
                messages.value = []
                unreadCount.value = 0
                message.success('已清空全部消息')
            } catch (error) {
                console.error('清空消息失败:', error)
                message.error('操作失败')
            }
        }

        // 格式化消息时间
        const formatMessageTime = (time) => {
            return dayjs(time).format('YYYY-MM-DD HH:mm:ss')
        }

        // 获取消息类型颜色
        const getMessageTypeColor = (type) => {
            const colors = {
                system: 'blue',
                notification: 'green',
                alert: 'red'
            }
            return colors[type] || 'default'
        }

        // 获取消息类型文本
        const getMessageTypeText = (type) => {
            const texts = {
                system: '系统消息',
                notification: '通知',
                alert: '提醒'
            }
            return texts[type] || type
        }

        // 消息详情相关
        const messageDetailVisible = ref(false)
        const selectedMessage = ref(null)

        // 显示消息详情
        const showMessageDetail = (message) => {
            selectedMessage.value = message
            messageDetailVisible.value = true
            if (!message.isRead) {
                readMessage(message)
            }
        }

        // 关闭消息详情
        const closeMessageDetail = () => {
            messageDetailVisible.value = false
            selectedMessage.value = null
        }

        // 处理下拉框显示状态变化
        const handleDropdownVisibleChange = async (visible) => {
            if (visible) {
                // 当下拉框显示时，重新加载消息列表和未读数量
                await Promise.all([
                    fetchMessages(),
                    fetchUnreadCount()
                ])
            }
        }

        // 组件挂载时获取消息列表和未读数量
        onMounted(() => {
            fetchMessages()
            fetchUnreadCount()
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
            showFeedback,
            handleFeedbackSubmit,
            handleFeedbackCancel,
            messages,
            unreadCount,
            messageLoading,
            readMessage,
            markAllRead,
            clearAllMessages,
            formatMessageTime,
            getMessageTypeColor,
            getMessageTypeText,
            messageDetailVisible,
            selectedMessage,
            showMessageDetail,
            closeMessageDetail,
            handleDropdownVisibleChange,
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
        
        &:hover {
            background-color: var(--item-hover-bg);
            
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
            color: var(--text-color);
            margin-bottom: 4px;
            line-height: 1.5;
        }
        
        .message-time {
            font-size: 12px;
            color: var(--text-color);
        }

        .message-status {
            font-size: 12px;
            transition: color 0.2s ease;
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
                    font-size: 13px;
                    margin-bottom: 16px;
                }
                
                .message-content {
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
    .message-detail-modal {
        :deep(.ant-modal-content) {
            .message-detail-content {
                .message-time, .message-content {
                    color: rgba(255, 255, 255, 0.85) !important;
                }
            }
        }
    }
}

body[data-theme="light"] {
    .message-detail-modal {
        :deep(.ant-modal-content) {
            .message-detail-content {
                .message-time, .message-content {
                    color: rgba(0, 0, 0, 0.85) !important;
                }
            }
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

/* 反馈弹窗样式 */
.feedback-modal {
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
                
                .anticon {
                    color: var(--primary-color);
                    margin-right: 8px;
                }
            }
        }

        .ant-modal-body {
            padding: 24px;
            background: var(--bg-color);
            
            .ant-form-item-label > label {
                color: var(--text-color);
                font-size: 14px;
                font-weight: 500;
            }
            
            .ant-select:not(.ant-select-customize-input) .ant-select-selector {
                background-color: var(--input-bg);
                border-color: var(--input-border);
                color: var(--text-color);
                
                &:hover {
                    border-color: var(--primary-color);
                }
            }
            
            .ant-select-focused:not(.ant-select-disabled).ant-select:not(.ant-select-customize-input) .ant-select-selector {
                border-color: var(--primary-color);
                box-shadow: 0 0 0 2px rgba(var(--primary-color-rgb), 0.2);
            }
            
            .ant-input {
                background-color: var(--input-bg);
                border-color: var(--input-border);
                color: var(--text-color);
                
                &::placeholder {
                    color: var(--text-secondary);
                }
                
                &:hover {
                    border-color: var(--primary-color);
                }
                
                &:focus {
                    border-color: var(--primary-color);
                    box-shadow: 0 0 0 2px rgba(var(--primary-color-rgb), 0.2);
                }
            }
            
            .ant-input-textarea-show-count::after {
                color: var(--text-secondary);
            }
        }

        .ant-modal-footer {
            background-color: var(--bg-secondary);
            border-top: 1px solid var(--border-color);
            padding: 16px 24px;
            
            .ant-btn {
                border-radius: 6px;
                height: 32px;
                padding: 4px 16px;
                font-size: 14px;
                transition: all 0.3s ease;
                
                &.ant-btn-primary {
                    background-color: var(--primary-color);
                    border-color: var(--primary-color);
                    color: #fff;
                    
                    &:hover {
                        background-color: color-mix(in srgb, var(--primary-color) 90%, white);
                        border-color: color-mix(in srgb, var(--primary-color) 90%, white);
                    }
                    
                    &:active {
                        background-color: color-mix(in srgb, var(--primary-color) 90%, black);
                        border-color: color-mix(in srgb, var(--primary-color) 90%, black);
                    }
                }
                
                &.ant-btn-default {
                    background-color: transparent;
                    border-color: var(--border-color);
                    color: var(--text-color);
                    
                    &:hover {
                        color: var(--primary-color);
                        border-color: var(--primary-color);
                    }
                    
                    &:active {
                        color: color-mix(in srgb, var(--primary-color) 90%, black);
                        border-color: color-mix(in srgb, var(--primary-color) 90%, black);
                    }
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

/* 动画效果 */
.feedback-modal {
    animation: modalFadeIn 0.3s ease;
}

@keyframes modalFadeIn {
    from {
        opacity: 0;
        transform: scale(0.95);
    }
    to {
        opacity: 1;
        transform: scale(1);
    }
}
</style>

<style lang="scss">
/* 全局主题样式 */
[data-theme="dark"] {
    .text-dark-100 {
        color: rgba(255, 255, 255, 0.85) !important;
    }
    
    .text-dark-200 {
        color: rgba(255, 255, 255, 0.45) !important;
    }
}

[data-theme="light"] {
    .text-dark-100 {
        color: rgba(0, 0, 0, 0.85) !important;
    }
    
    .text-dark-200 {
        color: rgba(0, 0, 0, 0.45) !important;
    }
}

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