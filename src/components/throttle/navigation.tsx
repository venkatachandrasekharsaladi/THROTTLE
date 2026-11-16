import { Link } from "@tanstack/react-router";
import { Icon } from "./icon";
import { rider } from "@/data/demo";
import { useProfile } from "@/hooks/use-profile";

export const NAV_ITEMS = [
  { to: "/", label: "Home", icon: "speed" },
  { to: "/bike", label: "My Bike", icon: "two_wheeler" },
  { to: "/fuel", label: "Fuel & Map", icon: "local_gas_station" },
  { to: "/community", label: "Community", icon: "groups" },
  { to: "/profile", label: "Profile", icon: "account_circle" },
] as const;

/** Persistent five-item bottom bar, mobile and tablet only. */
export function BottomNav() {
  return (
    <nav
      aria-label="Primary"
      className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur-xl lg:hidden"
    >
      <ul className="mx-auto grid h-16 max-w-2xl grid-cols-5">
        {NAV_ITEMS.map((item) => (
          <li key={item.to}>
            <Link
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              className="group relative flex h-full flex-col items-center justify-center gap-1 text-muted-foreground transition-colors hover:text-foreground data-[status=active]:text-primary"
            >
              <span className="absolute top-0 h-0.5 w-8 bg-primary opacity-0 group-data-[status=active]:opacity-100" />
              <Icon name={item.icon} className="text-[22px]" />
              <span className="text-[10px] font-bold uppercase leading-none tracking-wider">{item.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** Desktop side rail. */
export function SideNav() {
  const { state } = useProfile();
  const avatarSrc = state.profile.avatarDataUrl ?? rider.avatar;
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-border bg-card lg:flex">
      <div className="flex h-20 items-center gap-2 px-6">
        <span className="font-display text-[30px] tracking-wider text-primary">THROTTLE</span>
        <span className="h-4 w-1.5 -skew-x-12 bg-primary/40" />
      </div>
      <nav aria-label="Primary" className="flex-1 px-3">
        <ul className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <li key={item.to}>
              <Link
                to={item.to}
                activeOptions={{ exact: item.to === "/" }}
                className="flex h-11 items-center gap-3 rounded-lg border-l-2 border-transparent px-3 text-label-caps text-muted-foreground transition-colors hover:bg-elevated hover:text-foreground data-[status=active]:border-primary data-[status=active]:bg-elevated data-[status=active]:text-primary"
              >
                <Icon name={item.icon} />
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <Link to="/profile" className="m-3 flex items-center gap-3 rounded-lg p-3 hover:bg-elevated">
        <img src={avatarSrc} alt="" width={36} height={36} className="h-9 w-9 rounded-lg object-cover" />
        <div className="min-w-0">
          <p className="truncate text-sm font-bold">{state.profile.displayName}</p>
          <p className="truncate text-xs text-muted-foreground">@{state.profile.username}</p>
        </div>
      </Link>
    </aside>
  );
}
