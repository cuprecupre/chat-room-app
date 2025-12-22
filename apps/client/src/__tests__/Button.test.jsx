/**
 * Tests for Button component
 */

import { describe, test, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Button } from "../components/ui/Button";

describe("Button", () => {
    describe("rendering", () => {
        test("should render with children", () => {
            render(<Button>Click me</Button>);
            expect(screen.getByText("Click me")).toBeInTheDocument();
        });

        test("should render as button element", () => {
            render(<Button>Test</Button>);
            expect(screen.getByRole("button")).toBeInTheDocument();
        });

        test("should have type button by default", () => {
            render(<Button>Test</Button>);
            expect(screen.getByRole("button")).toHaveAttribute("type", "button");
        });

        test("should allow custom type", () => {
            render(<Button type="submit">Submit</Button>);
            expect(screen.getByRole("button")).toHaveAttribute("type", "submit");
        });
    });

    describe("variants", () => {
        test("should apply primary variant by default", () => {
            render(<Button>Primary</Button>);
            const button = screen.getByRole("button");
            expect(button.className).toContain("bg-orange-700");
        });

        test("should apply secondary variant", () => {
            render(<Button variant="secondary">Secondary</Button>);
            const button = screen.getByRole("button");
            expect(button.className).toContain("bg-neutral-600");
        });

        test("should apply danger variant", () => {
            render(<Button variant="danger">Danger</Button>);
            const button = screen.getByRole("button");
            expect(button.className).toContain("bg-red-500");
        });

        test("should apply outline variant", () => {
            render(<Button variant="outline">Outline</Button>);
            const button = screen.getByRole("button");
            expect(button.className).toContain("border");
        });

        test("should apply ghost variant", () => {
            render(<Button variant="ghost">Ghost</Button>);
            const button = screen.getByRole("button");
            expect(button.className).toContain("text-neutral-400");
        });
    });

    describe("sizes", () => {
        test("should apply md size by default", () => {
            render(<Button>Medium</Button>);
            const button = screen.getByRole("button");
            expect(button.className).toContain("h-11");
        });

        test("should apply sm size", () => {
            render(<Button size="sm">Small</Button>);
            const button = screen.getByRole("button");
            expect(button.className).toContain("h-9");
        });

        test("should apply lg size", () => {
            render(<Button size="lg">Large</Button>);
            const button = screen.getByRole("button");
            expect(button.className).toContain("h-12");
        });
    });

    describe("interactions", () => {
        test("should call onClick when clicked", () => {
            const handleClick = vi.fn();
            render(<Button onClick={handleClick}>Click me</Button>);

            fireEvent.click(screen.getByRole("button"));

            expect(handleClick).toHaveBeenCalledTimes(1);
        });

        test("should not call onClick when disabled", () => {
            const handleClick = vi.fn();
            render(
                <Button onClick={handleClick} disabled>
                    Disabled
                </Button>
            );

            fireEvent.click(screen.getByRole("button"));

            expect(handleClick).not.toHaveBeenCalled();
        });

        test("should be disabled when disabled prop is true", () => {
            render(<Button disabled>Disabled</Button>);
            expect(screen.getByRole("button")).toBeDisabled();
        });
    });

    describe("custom className", () => {
        test("should apply custom className", () => {
            render(<Button className="custom-class">Custom</Button>);
            const button = screen.getByRole("button");
            expect(button.className).toContain("custom-class");
        });

        test("should merge custom className with default classes", () => {
            render(<Button className="my-class">Merged</Button>);
            const button = screen.getByRole("button");
            expect(button.className).toContain("my-class");
            expect(button.className).toContain("rounded-3xl"); // Base class
        });
    });
});
