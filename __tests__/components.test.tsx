import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { SkeletonGrid, TypingIndicator } from "@/app/components/ui/SkeletonLoader";

describe("SkeletonLoader Components", () => {
  it("renders TypingIndicator with correct accessibility attributes", () => {
    render(<TypingIndicator />);
    const container = screen.getByLabelText("Mitra is typing");
    expect(container).toBeInTheDocument();
    
    // There should be 3 animated dots
    const dots = container.querySelectorAll(".typing-dots span");
    expect(dots.length).toBe(3);
  });

  it("renders SkeletonGrid with the correct number of items", () => {
    const { container } = render(<SkeletonGrid count={4} columns={2} />);
    
    // Check if 4 skeleton cards were rendered
    const cards = container.querySelectorAll(".card");
    expect(cards.length).toBe(4);
    
    // Verify the grid column styling
    const gridContainer = container.firstChild as HTMLElement;
    expect(gridContainer).toHaveStyle({
      display: "grid"
    });
  });
});
