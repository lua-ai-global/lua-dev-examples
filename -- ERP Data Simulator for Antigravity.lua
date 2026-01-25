-- ERP Data Simulator for Antigravity
local args = {...}
local id = args[1] or "UNKNOWN"

-- This table simulates a database of ERP items
local database = {
    ["SKU-990"] = {name = "Industrial Widget", stock = 15, location = "Main Warehouse"},
    ["SKU-102"] = {name = "Hydraulic Pump", stock = 4, location = "North Branch"},
    ["INV-5521"] = {type = "Invoice", status = "Paid", total = "$1,200.00"}
}

print("--- ERP System Query Results ---")
if database[id] then
    local item = database[id]
    if item.type == "Invoice" then
        print("Result: Found Invoice " .. id)
        print("Status: " .. item.status)
        print("Total: " .. item.total)
    else
        print("Result: Found Item " .. item.name)
        print("Stock Level: " .. item.stock)
        print("Location: " .. item.location)
    end
else
    print("Error: No record found for ID: " .. id)
    print("Please check the ID and try again.")
end
