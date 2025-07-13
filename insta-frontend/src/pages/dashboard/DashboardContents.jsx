import React, { useEffect, useState } from "react";
import { Zap, MessageSquare, Repeat, CheckCircle, XCircle, Clock, Users, RefreshCw } from "lucide-react";
import { Button } from "antd";
import axios from "../../lib/axios";
import toast from "react-hot-toast";

const Card = React.forwardRef(({ className, ...props }, ref) => <div ref={ref} className={`rounded-lg border bg-white text-card-foreground shadow-sm ${className || ""}`} {...props} />);
Card.displayName = "Card";

const CardContent = React.forwardRef(({ className, ...props }, ref) => <div ref={ref} className={`p-6 ${className || ""}`} {...props} />);
CardContent.displayName = "CardContent";

const DashboardContents = ({ onMenuChange }) => {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/dashboard/stats");
      setStats(res.data);
      toast.success("Stats refreshed");
    } catch (err) {
      toast.error("Failed to load Stats");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const statCards = stats
    ? [
        {
          title: "Plan Limit",
          value: "Unlimited",
          subtitle: "automation cap",
          icon: Zap,
          color: "bg-purple-200 text-purple-700",
          menuKey: "plans",
        },

        {
          title: "Active Automations",
          value: `${stats.summary.activeAutomations} of ${stats.summary.totalAutomations}`,
          subtitle: "running workflows",
          icon: Repeat,
          color: "bg-blue-200 text-blue-700",
          menuKey: "automations",
        },
        {
          title: "DMs Sent",
          value: stats.summary.totalDMsSent.toLocaleString(),
          subtitle: "total across automations",
          icon: MessageSquare,
          color: "bg-green-200 text-green-700",
          menuKey: "messages",
        },
        {
          title: "Replies Sent",
          value: stats.summary.totalRepliesSent.toLocaleString(),
          subtitle: "total replies",
          icon: Users,
          color: "bg-yellow-200 text-yellow-700",
          menuKey: "reports",
        },
      ]
    : [];

  const executionSummary = stats
    ? [
        {
          label: "Total Logs",
          value: stats.dmLogs.total.toLocaleString(),
          icon: Repeat,
          color: "text-gray-600",
        },
        {
          label: "Completed",
          value: stats.dmLogs.successful.toLocaleString(),
          icon: CheckCircle,
          color: "text-green-600",
        },
        {
          label: "Failed",
          value: stats.dmLogs.failed.toLocaleString(),
          icon: XCircle,
          color: "text-red-600",
        },
      ]
    : [];

  return (
    <div className="p-6 bg-gray-50 min-h-screen space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-purple-700">Welcome to InstaBOT</h1>
          <p className="text-sm text-gray-600">Automate your Instagram comment replies with personalized DMs</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchStats} disabled={loading} className="border border-purple-600 text-purple-600 hover:text-white hover:bg-purple-600 flex items-center gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button onClick={() => onMenuChange("automations")} className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2">
            <Zap className="h-4 w-4" /> New Automation
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card
              key={card.title}
              className="relative cursor-pointer hover:shadow-lg transition-shadow duration-200 border border-gray-200 shadow-sm"
              onClick={() => card.menuKey && onMenuChange(card.menuKey)}
            >
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="text-2xl font-bold text-gray-900">{card.value}</div>
                    <p className="text-sm text-gray-600">{card.title}</p>
                    {card.subtitle && <p className="text-xs text-gray-500">{card.subtitle}</p>}
                  </div>
                  <div className={`p-2 rounded-full ${card.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Execution Summary */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Execution Summary</h2>
        <p className="text-sm text-gray-500 mb-6">Last 30 days performance metrics</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          {executionSummary.map((item) => {
            const Icon = item.icon;
            return (
              <Card className="relative cursor-pointer hover:shadow-lg transition-shadow duration-200 border border-gray-200 shadow-sm" key={item.label}>
                <CardContent className="flex items-center gap-4">
                  <div className={`p-2 rounded-full bg-gray-100 ${item.color || "text-gray-700"}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-gray-900">{item.value}</div>
                    <p className="text-sm text-gray-600">{item.label}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DashboardContents;
