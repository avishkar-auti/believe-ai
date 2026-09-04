import { Drawer } from "../../components/ui/Drawer.js";
import { Button } from "../../components/ui/Button.js";
import { JobFilters, type JobFiltersProps } from "./JobFilters.js";

export function MobileFilterDrawer({
  open,
  onClose,
  resultCount,
  ...filterProps
}: JobFiltersProps & { open: boolean; onClose: () => void; resultCount: number }) {
  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Filters"
      className="lg:hidden"
      footer={
        <Button className="w-full" onClick={onClose}>
          Show {resultCount} {resultCount === 1 ? "job" : "jobs"}
        </Button>
      }
    >
      <JobFilters {...filterProps} />
    </Drawer>
  );
}
