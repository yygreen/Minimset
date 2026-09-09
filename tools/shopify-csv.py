import csv, re, sys

# ---- pull the authoritative values straight out of lib/data.ts -------------
src = open('lib/data.ts').read()

def field(block, name):
    m = re.search(name + r':\s*"((?:[^"\\]|\\.)*)"', block, re.S)
    return m.group(1).replace('\\"', '"').replace("\\'", "'") if m else None

def level_block(key):
    i = src.index('key: "%s"' % key)
    j = src.find('  },\n  {', i)
    return src[i: j if j != -1 else src.index('];', i)]

def cents(block, name):
    m = re.search(name + r':\s*(\d+)', block)
    return int(m.group(1)) if m else None

LEVELS = {}
for key in ("MEHUDAR_AA", "MEHUDAR_A", "CHINUCH"):
    b = level_block(key)
    spec = b[b.index('spec: {'):]
    LEVELS[key] = {
        "slug": field(b, 'slug'),
        "name": field(b, 'name'),
        "tier": field(b, 'tier'),
        "headline": field(b, 'headline'),
        "base": cents(b, 'basePriceCents'),
        "pitom": cents(b, 'pitomSurchargeCents'),
        "esrog": field(spec, 'esrog'),
        "lulav": field(spec, 'lulav'),
        "hadassim": field(spec, 'hadassim'),
    }

ADDONS = []
addon_src = src[src.index('export const ADDONS'): src.index('export const CODE_ALPHABET')]
for blk in addon_src.split('  {')[1:]:
    ADDONS.append({
        "id": field(blk, 'id'),
        "name": field(blk, 'name'),
        "note": field(blk, 'note'),
        "price": cents(blk, 'priceCents'),
    })

season = re.search(r'name:\s*"(Sukkos [^"]+)"', src).group(1)

# every value must have parsed, or the CSV would be quietly wrong
for k, v in LEVELS.items():
    assert all(v[f] for f in ("slug","name","headline","esrog","lulav","hadassim")) and v["base"], (k, v)
assert len(ADDONS) == 3 and all(a["price"] for a in ADDONS), ADDONS
print("parsed:", {k: (v["name"], v["base"], v["pitom"]) for k, v in LEVELS.items()})
print("addons:", [(a["name"], a["price"]) for a in ADDONS])
print("season:", season)

IMG = {
    "MEHUDAR_AA": ("https://4minimset.com/img/inspect-real.jpg", "Two chassidim examining an esrog and a sleeved lulav"),
    "MEHUDAR_A":  ("https://4minimset.com/img/esrog-single-b.jpg", "Esrogim waiting on the market table"),
    "CHINUCH":    ("https://4minimset.com/img/esrog-cluster.jpg", "A large clean esrog on the market table, others behind it"),
}
ADDON_IMG = {
    "extra-hadassim": ("https://4minimset.com/img/hadassim-01.jpg", "Three hadassim branches laid on cloth"),
    "extra-aravos":   ("https://4minimset.com/img/aravos-crop.jpg", "Fresh aravos on a reddish stem"),
    # No photograph of lulav rings exists yet, and the site's rule is that the
    # minim are never a render -- a wrong weave is obvious to the buyer. An
    # empty Image Src leaves Shopify's own neutral placeholder, which is honest;
    # a borrowed esrog photo on a product called "lulav rings" is not.
    "koishiklach":    ("", ""),
}

def money(c): return f"{c/100:.2f}"

def seo_desc(v):
    """Shopify allows 160 characters and the headline alone was using 70. The
    rest names what actually separates this from a shop counter: a Rav sorted
    it, it arrives sealed, and it comes to the door."""
    tail = " Sorted by Morei Hora'ah in Eretz Yisrael, sealed, shipped to your door."
    head = v["headline"]
    return (head + tail)[:158] if len(head) + len(tail) <= 158 else head[:158]


def body(v):
    return (
        f"<p>{v['headline']}</p>"
        "<p>Sorted and inspected in Eretz Yisrael by Morei Hora'ah, then sealed: the esrog in its "
        "box, the hadassim and aravos in a sealed bag, the lulav sealed. You open it in your sukkah.</p>"
        "<h3>The standard, word for word</h3>"
        f"<p><strong>Esrog.</strong> {v['esrog']}</p>"
        f"<p><strong>Lulav.</strong> {v['lulav']}</p>"
        f"<p><strong>Hadassim.</strong> {v['hadassim']}</p>"
        "<p><strong>Aravos.</strong> Fresh aravos, included in every set.</p>"
        "<h3>Delivery</h3>"
        "<p>Every set ships to the address on your order, tracked, in time to arrive before Yom "
        "Tov. One flat shipping charge per order however many sets are on it. If what arrives "
        "would not be worth what you paid, it is replaced from reserve stock at our cost.</p>"
        "<p>Ordering closes at the season deadline.</p>"
    )

HEAD = ["Handle","Title","Body (HTML)","Vendor","Type","Tags","Published",
        "Option1 Name","Option1 Value","Variant SKU","Variant Grams",
        "Variant Inventory Tracker","Variant Inventory Policy","Variant Fulfillment Service",
        "Variant Price","Variant Requires Shipping","Variant Taxable","Variant Weight Unit",
        "Image Src","Image Position","Image Alt Text","SEO Title","SEO Description","Status"]

def row(**k):
    r = dict.fromkeys(HEAD, "")
    r.update(k)
    return [r[h] for h in HEAD]

# Published and Status are two different switches and both bite on RE-import.
# A CSV re-import matches on Handle and updates the product in place, so
# Published=FALSE would pull a live product off the Online Store channel and
# Status=draft would take it off sale. These products are already active in the
# store; the CSV now preserves that. For a first import into a fresh store,
# set Status to "draft" here and publish deliberately.
TAGS = f"Arba Minim, Lulav and Esrog, {season}, Pre-order, Shipped"
VENDOR = "V'samachta Arba Minim"

# ---------------- the three sets ----------------
with open('shopify/products-sets.csv','w',newline='') as f:
    w = csv.writer(f); w.writerow(HEAD)
    for key in ("MEHUDAR_AA","MEHUDAR_A","CHINUCH"):
        v = LEVELS[key]; img, alt = IMG[key]
        variants = ([("With pitom", v["base"] + v["pitom"], "P"), ("No pitom", v["base"], "N")]
                    if v["pitom"] else [("Default Title", v["base"], "1")])
        opt_name = "Esrog" if v["pitom"] else "Title"
        for i, (val, price, sfx) in enumerate(variants):
            first = i == 0
            w.writerow(row(
                Handle=v["slug"],
                Title=v["name"] if first else "",
                **{"Body (HTML)": body(v) if first else ""},
                Vendor=VENDOR if first else "",
                Type="Arba Minim Set" if first else "",
                Tags=TAGS if first else "",
                Published="TRUE" if first else "",
                **{"Option1 Name": opt_name, "Option1 Value": val},
                **{"Variant SKU": f"VS-5787-{v['slug'].upper().replace('-','')}-{sfx}",
                   "Variant Grams": "0",
                   "Variant Inventory Tracker": "",
                   "Variant Inventory Policy": "deny",
                   "Variant Fulfillment Service": "manual",
                   "Variant Price": money(price),
                   "Variant Requires Shipping": "TRUE",
                   "Variant Taxable": "TRUE",
                   "Variant Weight Unit": "g"},
                # The SEO title has to carry the price a shopper actually meets,
                # which for A-A is the with-pitom default. Built from base alone
                # it advertised $100 against a $110 product page.
                **({"Image Src": img, "Image Position": "1", "Image Alt Text": alt,
                    "SEO Title": f"{v['name']} Lulav and Esrog Set, ${(v['base'] + (v['pitom'] or 0))//100}",
                    "SEO Description": seo_desc(v)} if first else {}),
                Status="active" if first else "",
            ))

# ---------------- the extras ----------------
with open('shopify/products-extras.csv','w',newline='') as f:
    w = csv.writer(f); w.writerow(HEAD)
    for a in ADDONS:
        img, alt = ADDON_IMG[a["id"]]
        w.writerow(row(
            Handle=a["id"], Title=a["name"],
            **{"Body (HTML)": f"<p>{a['note']}</p><p>Ships in the same box as your set, at no extra shipping charge.</p>"},
            Vendor=VENDOR, Type="Arba Minim Extra", Tags=TAGS, Published="TRUE",
            **{"Option1 Name": "Title", "Option1 Value": "Default Title",
               "Variant SKU": f"VS-5787-{a['id'].upper().replace('-','')}",
               "Variant Grams": "0", "Variant Inventory Policy": "deny",
               "Variant Fulfillment Service": "manual", "Variant Price": money(a["price"]),
               "Variant Requires Shipping": "TRUE", "Variant Taxable": "TRUE",
               "Variant Weight Unit": "g",
               **({"Image Src": img, "Image Position": "1", "Image Alt Text": alt} if img else {}),
               "SEO Title": f"{a['name']} - V'samachta Arba Minim",
               "SEO Description": a["note"][:155]},
            Status="active",
        ))
print("written")
