import ModeToggle from "../ui/mode-toggle";

function Header() {
  return (
    <header className="bg-background fixed top-0 z-30 flex min-h-16 w-full items-center border-b shadow">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6">
        <span className="block text-xl font-bold">Jeet Yet?</span>
        <ModeToggle />
      </div>
    </header>
  );
}

export default Header;
