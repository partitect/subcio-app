This comprehensive guide outlines the major classes and static utilities provided across the referenced PyonFX modules (`ass_core`, `convert`, `shape`, and `utils`), focusing on their purpose, key attributes, and functionality.

## PyonFX Core Components

### I. pyonfx.ass\_core (ASS File Structure and Events)

The `pyonfx.ass_core` module provides the foundational objects for representing and manipulating Advanced Substation Alpha (ASS) files.

#### A. `Ass` Class (File Handling)

The `Ass` class contains all information about an ASS file and methods for processing input and generating output. It automatically determines absolute paths for loaded audio and video files, ensuring they load correctly wherever the generated file is placed.

| Attribute | Type | Description |
| :--- | :--- | :--- |
| **path\_input** | `str` | Absolute path for the input file. |
| **path\_output** | `str` | Absolute path for the output file (default: "output.ass"). |
| **meta** | `Meta` | Contains header information about the ASS file. |
| **styles** | `list[Style]` | Contains all styles defined in the ASS file. |
| **lines** | `list[Line]` | Contains all event lines in the ASS file. |

**Key Methods:**

*   **`get_data()`**: Utility function to easily retrieve the **meta**, **styles**, and **lines**.
*   **`add_style(style_name, style)`**: Adds a given `Style` object to the output if it doesn't already exist, serializing it into the `[V4+ Styles]` section.
*   **`write_line(line)`**: Appends a `Line` object to the private output list. Nothing is written to the file until `save()` is called.
*   **`save(quiet=False)`**: Writes all accumulated data in the private output list to the output file.
*   **`open_aegisub()`**: Attempts to open the subtitle output file in Aegisub.
*   **`open_mpv()`**: Opens the output subtitle file using MPV media player, optionally hot-reloading subtitles in an existing instance or falling back to Aegisub.

#### B. `Meta` Class (Header Metadata)

The `Meta` object stores general information about the ASS script.

| Attribute | Type | Description |
| :--- | :--- | :--- |
| **wrap\_style** | `int` \| `None` | Determines how line breaking is applied to the subtitle line. |
| **scaled\_border\_and\_shadow** | `bool` \| `None` | If True, border/shadow scaling uses script resolution; if False, it uses video resolution. |
| **play\_res\_x**, **play\_res\_y** | `int` \| `None` | Video width and height resolution. |
| **audio**, **video** | `str` \| `None` | Absolute paths to loaded audio and video files. |

#### C. `Style` Class (Typographic Rules)

The `Style` object contains the typographic formatting rules applied to dialogue lines.

| Attribute Category | Attributes | Details |
| :--- | :--- | :--- |
| **Identity** | **name**, **fontname**, **fontsize** | Style name, font name, and size in points. |
| **Colors** | **color1**, **alpha1**; **color2**, **alpha2**; **color3**, **alpha3**; **color4**, **alpha4** | Primary color (fill), secondary color (karaoke), outline/border color, and shadow color, each with corresponding transparency. |
| **Formatting** | **bold**, **italic**, **underline**, **strikeout** | Boolean indicators for text formatting. |
| **Geometry** | **scale\_x**, **scale\_y**, **spacing**, **angle** | Horizontal and vertical text scaling (percentage), horizontal letter spacing, and text rotation angle (degrees). |
| **Layout** | **alignment**, **margin\_l**, **margin\_r**, **margin\_v** | Text alignment (ASS code) and margins in pixels. |
| **Borders** | **outline**, **shadow**, **border\_style** | Border thickness, shadow offset distance, and style (True for opaque box, False for standard outline). |

**Key Methods:**

*   **`from_ass_line(line)`**: Class method that parses an ASS line and returns the corresponding `Style` object.
*   **`serialize(style_name)`**: Serializes the `Style` object into an ASS style line string.

#### D. Event Components (`Line`, `Word`, `Syllable`, `Char`)

These objects provide hierarchical information about the timing, position, and text of a subtitle event. All time attributes (`start_time`, `end_time`, `duration`) are in milliseconds (ms).

| Class | Purpose | Key Attributes |
| :--- | :--- | :--- |
| **`Line`** | Represents a single subtitle line (event) in the ASS file. | **comment**, **layer**, **start\_time**, **end\_time**, **style**, **raw\_text** (includes tags), **text** (stripped). Includes calculated positional geometry (**width**, **height**, **x**, **y**, **ascent**, **descent**, **left**, **bottom**, etc.). Also contains lists of **words**, **syls**, and **chars**. |
| **`Word`** | Information about a single word in a line. | **i** (word index), **start\_time**, **end\_time**, **duration** (often same as line), **text**, **prespace**, **postspace**, and positional attributes. |
| **`Syllable`** | Information about a single syllable, often used for karaoke effects. | **i** (syllable index), **word\_i** (word index), **tags** (ASS override tags preceding text, excluding `\k` tags), **inline\_fx**, and positional attributes. |
| **`Char`** | Information about a single character in a line. | **i** (character index), **word\_i**, **syl\_i** (syllable index), **syl\_char\_i** (index within syllable), **text** (the character), **inline\_fx**, and precise positional attributes (**width**, **height**, **x**, **y**, etc.). |

***

### II. pyonfx.convert (Conversion Utilities)

The `Convert` class holds static methods for converting between different data formats, particularly for colors, timestamps, and text geometry.

#### A. Color and Alpha Conversions

The module supports conversions between ASS, RGB, and HSV color models, and ASS alpha strings and decimal values.

| Conversion Task | Function | Input/Output Formats |
| :--- | :--- | :--- |
| **Alpha ASS to Decimal** | `alpha_ass_to_dec(alpha_ass)` | Converts `&HXX&` string (ASS format) to integer decimal ``. |
| **Alpha Decimal to ASS** | `alpha_dec_to_ass(alpha_dec)` | Converts decimal `` to `&HXX&` string (ASS format). |
| **ASS to RGB** | `color_ass_to_rgb(color_ass)` | Converts `&HBBGGRR&` to a tuple `(R, G, B)` of integers or a string `#RRGGBB`. |
| **RGB to ASS** | `color_rgb_to_ass(color_rgb)` | Converts `#RRGGBB` string or `(R, G, B)` tuple to `&HBBGGRR&`. |
| **ASS to HSV** | `color_ass_to_hsv(color_ass)` | Converts `&HBBGGRR&` to an HSV tuple: H in `[0, 360)`, S/V in ``. |
| **HSV to ASS** | `color_hsv_to_ass(color_hsv)` | Converts an HSV tuple to `&HBBGGRR&`. |

#### B. Geometry Conversions (Text and Shapes)

`Convert` allows for converting text objects into geometric data (shapes or pixels).

*   **`text_to_shape(obj)`**: Converts a text object (`Line`, `Word`, `Syllable`, or `Char`) into a **Shape** object, using its style information. This is useful for creating **deforming effects**.
*   **`text_to_clip(obj, an=5)`**: Converts a text object into an ASS shape suitable for use in a `\clip` tag. This function applies necessary transformations since shapes inside clips cannot be positioned with `\pos()`. It facilitates the creation of **text masks**.
*   **`text_to_pixels(obj, supersampling=8)`**: Converts a text object into a **PixelCollection** (a list of dictionaries containing `x`, `y`, and `alpha` for each pixel). This method is highly effective for generating **text decaying or light effects**. A lightweight style with `an=7` is suggested for pixel output.
*   **`shape_to_pixels(shape, supersampling=8)`**: Converts a `Shape` object directly into a `PixelCollection`.
*   **`image_to_pixels(image_path)`**: Converts an image file to a `PixelCollection`, optionally allowing resizing or skipping fully transparent pixels.

***

### III. pyonfx.shape (Vector Graphics Manipulation)

The `Shape` class is a high-level wrapper used to store and manipulate the vector outlines found in ASS drawing tags (`{\p}`).

#### A. Core Shape Concepts

*   **`ShapeElement`**: Represents a single drawing command (like "m" for move, "l" for line, "b" for Bézier curve) and its list of coordinate pairs (`coordinates`).
*   **`Shape`**: Stores its geometry as a list of `ShapeElement` objects via the **elements** attribute. The textual ASS representation is returned by the read-only **drawing\_cmds** property, ensuring it stays synchronized with the geometry. The class supports chaining multiple geometric manipulation methods.

#### B. Geometric Transformations

`Shape` methods allow for complex manipulation of vector outlines.

*   **`bounding(exact=False)`**: Calculates the shape’s bounding box, returning a tuple `(x0, y0, x1, y1)`.
*   **`map(fun)`**: Applies a custom transformation function to every point in the shape. This is useful for creating effects like **wobbling or deforming** the entire shape.
*   **`move(x, y)`**: Displaces the shape by specified distances along the x and y axes.
*   **`align(an=5)`**: Repositions the shape so that a chosen pivot point (defined by alignment `an`) coincides with the subtitle line's alignment point.
*   **`scale(fscx=100, fscy=100)`**: Scales the shape horizontally (`fscx`) and vertically (`fscy`) using percentages, similar to ASS style tags.
*   **`rotate(frx=0.0, fry=0.0, frz=0.0)`**: Rotates the shape around the X, Y, and Z axes in degrees, mimicking ASS `frx`, `fry`, and `frz` tags.
*   **`shear(fax=0.0, fay=0.0)`**: Applies a slant/skew transformation, mimicking ASS `fax` and `fay` tags.
*   **`flatten(tolerance)`**: Splits Bézier curves into standard line segments.
*   **`split(max_len=16, tolerance=1.0)`**: Flattens curves and then splits lines into segments no longer than `max_len`. This increases the number of points available for subsequent `map()` operations, resulting in smoother deforming effects.
*   **`buffer(dist_xy, dist_y=None, kind='border', join='round')`**: Returns an expanded or contracted version of the shape, useful for creating borders or expanding/contracting the fill.
*   **`boolean(other, op, ...)`**: Calculates the boolean combination (`union`, `intersection`, `difference`, or `xor`) between the shape and another `other` shape.

#### C. Morphing

Shape morphing interpolates the geometry between two shapes.

*   **`morph(target, t)`**: Interpolates the current shape towards a `target` shape at a fractional point in time `t` (0.0 to 1.0), returning a new shape. The interpolation process matches individual loops (shells and holes) based on criteria like centroid distance, area similarity, and overlap.
*   **`morph_multi(src_shapes, tgt_shapes, t)`**: Interpolates **multiple** source shapes to multiple target shapes at once. It returns a dictionary mapping `(src_id, tgt_id)` to the resulting shape.

#### D. Shape Factory Methods

Static methods are available to generate standard shapes centered around (0,0):

*   **`polygon(edges, side_length)`**: Creates a regular n-sided polygon.
*   **`ellipse(w, h)`**: Creates an ellipse with given width (`w`) and height (`h`).
*   **`ring(out_r, in_r)`**: Creates a ring with inner and outer radii.
*   **`heart(size, offset)`**: Creates a heart shape.
*   **`star(edges, inner_size, outer_size)`**: Creates a star with n outer edges and defined inner/outer sizes.
*   **`glance(edges, inner_size, outer_size)`**: Similar to a star, but uses curves instead of inner edges between outer edges.
*   **`PIXEL`**: A string representation of a single pixel: `'m 0 1 l 0 0 1 0 1 1'`.

***

### IV. pyonfx.utils (General Utilities)

The `Utils` module offers static helpers for flow control, interpolation, and time management.

#### A. Interpolation and Easing

*   **`accelerate(pct, acc)`**: Applies an acceleration (easing) function to a progress percentage value (`pct`). The acceleration (`acc`) can be a float (power value, 1.0 being linear) or a string representing a preset easing function (e.g., `'in_out_quad'`).
*   **`interpolate(pct, val1, val2, acc=1.0)`**: Interpolates between two values (`val1`, `val2`)—which can be numbers or ASS color/alpha strings—using a percentage `pct` and an optional acceleration function.

#### B. `FrameUtility` (Frame-Accurate Time Management)

The `FrameUtility` class allows working accurately in a frame-per-frame environment by iterating over frames between `start_ms` and `end_ms` using video timestamps.

*   **Timing Approach**: It employs a **"mid-point" approach** for frame timings, centering the frame duration around the player's seek time. This ensures smooth transitions and avoids flickering in Constant Frame Rate (CFR) or Variable Frame Rate (VFR) videos.
*   **Iteration**: When iterating (`for s, e, i, n in FU`), it yields the start time (`s`), end time (`e`), current frame index (`i`), and total frame count (`n`) for each step.
*   **`add(start_time, end_time, end_value, accelerator=1.0)`**: This method is the **frame-by-frame equivalent of the ASS `\t` tag**. When used inside a `FrameUtility` loop, it calculates the transformed numeric value at the current frame based on the defined transformation parameters.

#### C. `ColorUtility` (Color Transformation Management)

This class parses all color transformations within a list of input lines to allow easy retrieval of the correct interpolated color at any given time.

*   **Continuity**: It is important to note that **color changes are treated as continuous** across line boundaries, ensuring the correct color is available even if a line lacks explicit color tags.
*   **`get_color_change(line)`**: Returns a string of interpolated color changes (using `\t` tags) that span the duration of the provided `Line` object, ensuring temporal accuracy.
*   **`get_fr_color_change(line)`**: Returns a string containing the single, calculated color(s) that are active at `line.start_time` (designed for use when iterating frame-by-frame).

***

The PyonFX system acts like an advanced subtitling toolkit. If the ASS file is a complex machine with many adjustable parts (like styles, timings, and geometry), the **Ass Core** classes (`Line`, `Style`, `Meta`) define the machine's blueprint. The **Convert Functions** are the specialized wrenches used to adjust components (like changing color models or turning text into shapes). The **Shape Functions** are the drafting tools, allowing complex geometry to be drawn, manipulated, and animated. Finally, the **Utils** are the master timers and control panels, ensuring that all changes happen smoothly and accurately across every single frame and across complex, timed transformations.