import { render, screen } from "@testing-library/react";
import Home from "../app/page";

describe("Home Page", () => {
  it("renders the Cicero title", () => {
    render(<Home />);
    expect(screen.getByText(/Cicero/i)).toBeInTheDocument();
  });

  it("renders the mock simulator header", () => {
    render(<Home />);
    expect(screen.getByText(/Simulador de Mocks/i)).toBeInTheDocument();
  });
});
