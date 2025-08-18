// Base types
export type D2LID = number;
export type UTCDateTime = string;
export type APIURL = string;

/**
 * Grade object types enumeration for D2L Brightspace.
 *
 * Grade objects support several different means of assessment. Each type
 * represents a different way grades can be structured and calculated.
 */
export enum GRADEOBJ_T {
    /**
     * Numeric grade object type.
     * Allows for numeric point-based grading with decimal values.
     */
    Numeric = 1,

    /**
     * Pass/Fail grade object type.
     * Simple binary grading system with pass or fail outcomes.
     */
    PassFail = 2,

    /**
     * SelectBox grade object type.
     * Uses predefined grade scheme with selectable grade ranges.
     */
    SelectBox = 3,

    /**
     * Text grade object type.
     * Allows for text-based feedback without numeric scoring.
     */
    Text = 4,

    /**
     * Calculated grade object type.
     * System-calculated grades based on other grade objects.
     *
     * @remarks Direct creation through APIs is not supported.
     */
    Calculated = 5,

    /**
     * Formula grade object type.
     * Grades calculated using custom formulas.
     *
     * @remarks Direct creation through APIs is not supported.
     */
    Formula = 6,

    /**
     * Final Calculated grade object type.
     * Represents the final calculated grade for a course.
     *
     * @remarks Direct creation through APIs is not supported.
     */
    FinalCalculated = 7,

    /**
     * Final Adjusted grade object type.
     * Represents manually adjusted final grades.
     *
     * @remarks Direct creation through APIs is not supported.
     */
    FinalAdjusted = 8,

    /**
     * Category grade object type.
     * Represents a category containing other grade objects.
     *
     * @remarks Direct creation through APIs is not supported.
     */
    Category = 9,
}

/**
 * Grading system types for D2L Brightspace organizations.
 *
 * Each org unit is configured with a grading system that determines
 * how final grades are calculated from individual grade objects.
 */
export enum GRADINGSYSTEM_T {
    /**
     * Points-based grading system.
     *
     * Final grade is calculated as the sum of raw points from each grade object.
     * For example: Test 1 (10 points) + Test 2 (15 points) = 25 total points.
     */
    Points = "Points",

    /**
     * Weighted grading system.
     *
     * Final grade is calculated as a weighted sum where each grade object
     * represents a percentage of the final grade.
     * For example: Test 1 (30% weight) + Test 2 (15% weight) = 45% of final grade.
     */
    Weighted = "Weighted",

    /**
     * Formula-based grading system.
     *
     * Final grade is determined by a custom formula. All grade items and
     * categories within the formula use the Points method for calculation.
     */
    Formula = "Formula",
}

// Rich Text types
export type RichText = {
    Html: string;
    Text: string;
};

export type RichTextInput = RichText; // We don't care for now.

export type FileAttachment = {
    FileId: D2LID;
    FileName: string;
    Size: number /** Field is `FileSize` in API Documentation but actual response is `Size` (tested for LE 1.85 - 1.9) */;
};
