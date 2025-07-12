import React from "react";
import { Zap, MessageSquare, Repeat, CheckCircle, XCircle, Clock, Users } from "lucide-react";
import { Button } from "antd";

const Card = React.forwardRef(({ className, ...props }, ref) => (
    <div ref={ref} className={`rounded-lg border bg-white text-card-foreground shadow-sm ${className || ""}`} {...props} />
));
Card.displayName = "Card";

const CardContent = React.forwardRef(({ className, ...props }, ref) => (
    <div ref={ref} className={`p-6 ${className || ""}`} {...props} />
));
CardContent.displayName = "CardContent";

const DashboardContents = ({ onMenuChange }) => {
    const statCards = [
        {
            title: "Plan Limit",
            value: "Unlimited",
            subtitle: "active workflows",
            icon: Repeat,
            color: "bg-purple-200 text-purple-700",
            menuKey: "plans",
        },
        {
            title: "Active Automations",
            value: "8 of 9 total",
            icon: Repeat,
            color: "bg-blue-200 text-blue-700",
            menuKey: "automations",

        },
        {
            title: "Messages Sent",
            value: "11,710",
            subtitle: "last 30 days",
            icon: MessageSquare,
            color: "bg-green-200 text-green-700",
            menuKey: "messages",
        },
        {
            title: "Response Rate",
            value: "100%",
            subtitle: "last 30 days",
            icon: Users,
            color: "bg-yellow-200 text-yellow-700",
            menuKey: "reports",
        },
    ];

    const executionSummary = [
        { label: "Total", value: "11,725", icon: Repeat },
        { label: "Completed", value: "11,710", icon: CheckCircle, color: "text-green-600" },
        { label: "Failed", value: "15", icon: XCircle, color: "text-red-600" },
        { label: "Waiting", value: "0", icon: Clock, color: "text-orange-600" },
    ];

    return (
        <div className="p-6 bg-gray-50 min-h-screen space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-purple-700">Welcome to InstaBOT</h1>
                    <p className="text-sm text-gray-600">
                        Automate your Instagram comment replies with personalized DMs:{" "}
                    </p>
                </div>
                <Button onClick={() => onMenuChange("automations")} className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2">
                    <Zap className="h-4 w-4" /> New Automation
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((card) => {
                    const Icon = card.icon;
                    return (
                        <Card key={card.title}
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
                            <Card
                                className="relative cursor-pointer hover:shadow-lg transition-shadow duration-200 border border-gray-200 shadow-sm"
                                key={item.label}>
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
