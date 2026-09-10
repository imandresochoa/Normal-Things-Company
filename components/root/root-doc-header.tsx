import type { ReactNode } from "react";

type RootDocHeaderProps = {
  title: string;
  plate?: ReactNode;
  children: ReactNode;
};

export function RootDocHeader({ title, plate, children }: RootDocHeaderProps) {
  return (
    <header className="root-doc-header">
      <h1>{title}</h1>
      {plate ? <div className="root-doc-plate">{plate}</div> : null}
      {children}
    </header>
  );
}
