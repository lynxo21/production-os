import { Briefcase, Box, Users, FileText } from "lucide-react";

const stats = [
  { label: "Active Jobs", value: "0", icon: Briefcase },
  { label: "Inventory Items", value: "0", icon: Box },
  { label: "Crew Members", value: "0", icon: Users },
  { label: "Clients", value: "0", icon: FileText },
];

export default function DashboardPage() {
  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-100">
          Dashboard
        </h1>
        <p className="text-neutral-500 text-sm mt-1">
          Welcome to Production OS
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-neutral-900 border border-neutral-800 rounded-lg p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold tracking-widest uppercase text-neutral-500">
                  {stat.label}
                </span>
                <Icon size={14} className="text-neutral-600" />
              </div>
              <div className="text-3xl font-bold text-neutral-100 font-mono">
                {stat.value}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}