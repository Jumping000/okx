import { defineStore } from "pinia";
import { getAccountConfig } from "@/api/module/Basics";
import { verifyInvitee } from "@/api/auth";

// 仅用于存储数据的 store
export const useOverviewStore = defineStore("overview", {
  state: () => ({
    // 资产概览
    assets: {
      total: "93,245.67",
      available: "32,654.89",
      positionCount: 0,
    },

    // 通信状态
    connection: {
      network: true,
      publicChannel: false,
      privateChannel: false,
      businessChannel: false,
    },
    isVip: false,
    // 最近交易
    recentTrades: [
      {
        symbol: "BTC/USDT",
        type: "buy",
        amount: "0.0234",
        price: "43,567.89",
        time: "10:23:45",
      },
      {
        symbol: "ETH/USDT",
        type: "sell",
        amount: "0.5678",
        price: "2,345.67",
        time: "10:15:32",
      },
      {
        symbol: "BTC/USDT",
        type: "buy",
        amount: "0.0156",
        price: "43,589.23",
        time: "10:05:18",
      },
    ],
    // 账户统计
    statistics: {
      today: {
        tradeCount: 24,
        tradeVolume: "43,567.89",
        pnl: 1234.56,
        winRate: 65.4,
        avgHoldTime: 45,
        fees: 89.32,
      },
      week: {
        tradeCount: 168,
        tradeVolume: "298,567.89",
        pnl: -2345.67,
        winRate: 58.2,
        avgHoldTime: 62,
        fees: 596.78,
      },
      month: {
        tradeCount: 752,
        tradeVolume: "1,243,567.89",
        pnl: 15678.9,
        winRate: 61.8,
        avgHoldTime: 55,
        fees: 2489.45,
      },
    },
    currentPeriod: "today",
  }),
  actions: {
    async getAccountConfigApi() {
      const AccountResponse = await getAccountConfig();
      if (AccountResponse.code == "0") {
        const verifyInviteeResponse = await verifyInvitee(AccountResponse.data[0].uid);
        if (verifyInviteeResponse.code === 200 && verifyInviteeResponse.success == true) {
          this.isVip = verifyInviteeResponse.data.isValid;
        }
      }
    },
  },
});
