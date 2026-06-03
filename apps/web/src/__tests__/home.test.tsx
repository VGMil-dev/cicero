import { render, screen } from "@testing-library/react";
import Home from "../app/page";

describe("Home Page", () => {
  it("renders the Next.js logo", () => {
    render(<Home />);
    const logo = screen.getByAltText("Next.js logo");
    expect(logo).toBeInTheDocument();
  });

  it("renders the getting started text", () => {
    render(<Home />);
    expect(screen.getByText(/To get started, edit the page.tsx file/i)).toBeInTheDocument();
  });
});
