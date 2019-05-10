import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import TextField from "@material-ui/core/TextField";
import * as isUrl from "is-url";
import * as React from "react";

import AutocompleteSelectMenu, {
  SelectMenuItem
} from "../../../components/AutocompleteSelectMenu";
import ConfirmButton, {
  ConfirmButtonTransitionState
} from "../../../components/ConfirmButton";
import Form from "../../../components/Form";
import FormSpacer from "../../../components/FormSpacer";
import { SearchCategories_categories_edges_node } from "../../../containers/SearchCategories/types/SearchCategories";
import { SearchCollections_collections_edges_node } from "../../../containers/SearchCollections/types/SearchCollections";
import i18n from "../../../i18n";

export type MenuItemType = "category" | "collection" | "link" | "page";
export interface MenuItemData {
  id: string;
  type: MenuItemType;
}

export interface MenuItemDialogFormData extends MenuItemData {
  name: string;
}

export interface MenuItemDialogProps {
  confirmButtonState: ConfirmButtonTransitionState;
  disabled: boolean;
  initial?: MenuItemDialogFormData;
  initialDisplayValue?: string;
  loading: boolean;
  open: boolean;
  collections: SearchCollections_collections_edges_node[];
  categories: SearchCategories_categories_edges_node[];
  onClose: () => void;
  onSubmit: (data: MenuItemDialogFormData) => void;
  onQueryChange: (query: string) => void;
}

const defaultInitial: MenuItemDialogFormData = {
  id: "",
  name: "",
  type: "category"
};

function findMenuItem(menu: SelectMenuItem[], value: string): SelectMenuItem {
  const matches = menu.map(menuItem =>
    menuItem.children
      ? findMenuItem(menuItem.children, value)
      : menuItem.value === value
      ? menuItem
      : undefined
  );
  return matches.find(match => match !== undefined);
}

function getMenuItemData(value: string): MenuItemData {
  const [type, ...idParts] = value.split(":");
  return {
    id: idParts.join(":"),
    type: type as MenuItemType
  };
}

function getDisplayValue(menu: SelectMenuItem[], value: string): string {
  const menuItemData = getMenuItemData(value);
  if (menuItemData.type === "link") {
    return menuItemData.id;
  }
  return findMenuItem(menu, value).label.toString();
}

const MenuItemDialog: React.StatelessComponent<MenuItemDialogProps> = ({
  confirmButtonState,
  disabled,
  initial,
  initialDisplayValue,
  loading,
  onClose,
  onSubmit,
  onQueryChange,
  open,
  categories,
  collections
}) => {
  const [displayValue, setDisplayValue] = React.useState(
    initialDisplayValue || ""
  );
  const [url, setUrl] = React.useState<string>(undefined);

  // Refresh initial display value if changed
  React.useEffect(() => setDisplayValue(initialDisplayValue), [
    initialDisplayValue
  ]);

  let options: SelectMenuItem[] = [];

  if (categories.length > 0) {
    options = [
      ...options,
      {
        children: categories.map(category => ({
          label: category.name,
          value: "category:" + category.id
        })),
        label: i18n.t("Categories ({{ number }})", {
          number: categories.length
        })
      }
    ];
  }

  if (collections.length > 0) {
    options = [
      ...options,
      {
        children: collections.map(collection => ({
          label: collection.name,
          value: "collection:" + collection.id
        })),
        label: i18n.t("Collections ({{ number }})", {
          number: collections.length
        })
      }
    ];
  }

  if (url) {
    options = [
      {
        label: (
          <div
            dangerouslySetInnerHTML={{
              // FIXME: Improve label
              __html: i18n.t("link to: <strong>{{ url }}</strong>", {
                context: "add link to navigation",
                url
              })
            }}
          />
        ),
        value: "link:" + url
      }
    ];
  }

  const handleQueryChange = (query: string) => {
    if (isUrl(query)) {
      setUrl(query);
    } else if (url) {
      setUrl(undefined);
    }
    onQueryChange(query);
  };

  return (
    <Dialog
      open={open}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        style: { overflowY: "visible" }
      }}
    >
      <DialogTitle>
        {i18n.t("Add Item", {
          context: "create new menu item"
        })}
      </DialogTitle>
      <Form initial={initial || defaultInitial} onSubmit={onSubmit}>
        {({ change, data, submit }) => {
          const handleSelectChange = (event: React.ChangeEvent<any>) => {
            const value = event.target.value;
            const menuItemData = getMenuItemData(value);
            change(
              {
                target: {
                  name: "id",
                  value: menuItemData.id
                }
              } as any,
              () =>
                change(
                  {
                    target: {
                      name: "type",
                      value: menuItemData.type
                    }
                  } as any,
                  () => setDisplayValue(getDisplayValue(options, value))
                )
            );
          };

          return (
            <>
              <DialogContent style={{ overflowY: "visible" }}>
                <TextField
                  disabled={disabled}
                  label={i18n.t("Name")}
                  fullWidth
                  value={data.name}
                  onChange={change}
                  name={"name" as keyof MenuItemDialogFormData}
                  helperText=""
                />
                <FormSpacer />
                <AutocompleteSelectMenu
                  disabled={disabled}
                  onChange={handleSelectChange}
                  name={"id" as keyof MenuItemDialogFormData}
                  helperText=""
                  label={i18n.t("Link")}
                  displayValue={displayValue}
                  loading={loading}
                  error={false}
                  options={options}
                  placeholder={i18n.t("Start typing to begin search...")}
                  onInputChange={handleQueryChange}
                />
              </DialogContent>
              <DialogActions>
                <Button onClick={onClose}>
                  {i18n.t("Cancel", { context: "button" })}
                </Button>
                <ConfirmButton
                  transitionState={confirmButtonState}
                  color="primary"
                  variant="contained"
                  onClick={submit}
                >
                  {i18n.t("Submit", { context: "button" })}
                </ConfirmButton>
              </DialogActions>
            </>
          );
        }}
      </Form>
    </Dialog>
  );
};
MenuItemDialog.displayName = "MenuItemDialog";
export default MenuItemDialog;