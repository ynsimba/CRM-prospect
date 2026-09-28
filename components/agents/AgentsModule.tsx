import type { ReactNode } from "react";
import Shell from "@/components/Shell";
import type { AgentScope } from "@/lib/agents";

type AgentsModuleProps = {
  scope: AgentScope;
  active: string;
  title?: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
  breadcrumb?: ReactNode;
  children?: ReactNode;
};

export default function AgentsModule({ title, subtitle, actions, breadcrumb, children }: AgentsModuleProps) {
  return (
    <Shell activeHref="/direction/agents/liste">
      <div className="cockpit">
        {title || subtitle || actions || breadcrumb || children ? (
          <div className="cockpit-main">
            {breadcrumb}
            {title || subtitle || actions ? (
              <div className="page-head">
                <div>
                  {title ? <h1 className="page-title">{title}</h1> : null}
                  {subtitle ? <p className="card-sub">{subtitle}</p> : null}
                </div>
                {actions ? <div className="page-head-actions">{actions}</div> : null}
              </div>
            ) : null}
            {children}
          </div>
        ) : null}
      </div>
    </Shell>
  );
}
