import ModeToggle from "../ui/mode-toggle";
import { Separator } from "../ui/separator";
import { UserAvatarButton } from "../ui/user-avatar-button";

function Header() {
  return (
    <header className="bg-background fixed top-0 z-30 flex min-h-16 w-full items-center border-b shadow">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6">
        <span className="block flex-1 text-xl font-bold">Jeet Yet?</span>
        <div className="flex flex-none items-center gap-4">
          <UserAvatarButton />
          <Separator orientation="vertical" />
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}

export default Header;
