/**
 * D2L Brightspace API Grade System TypeScript Types
 */

import { APIURL, D2LID, GRADEOBJ_T, RichText, RichTextInput, UTCDateTime } from "./common";

interface AssociatedTool {
    ToolId: D2LID;
    ToolItemId: D2LID;
}

interface BaseGradeObject {
    Id?: D2LID; // Not on input actions
    Name: string;
    ShortName: string;
    CategoryId: D2LID | null;
    Description: RichText | RichTextInput; // RichTextInput on input actions
    Weight?: number; // Not on input actions
    AssociatedTool: AssociatedTool | null;
    IsHidden: boolean;
}

interface NumericGradeObject extends BaseGradeObject {
    MaxPoints: number;
    CanExceedMaxPoints: boolean;
    IsBonus: boolean;
    ExcludeFromFinalGradeCalculation: boolean;
    GradeSchemeId: D2LID | null;
    GradeType: "Numeric";
    GradeSchemeUrl?: APIURL; // Not on input actions
}

interface PassFailGradeObject extends BaseGradeObject {
    MaxPoints: number;
    IsBonus: boolean;
    ExcludeFromFinalGradeCalculation: boolean;
    GradeSchemeId: D2LID | null;
    GradeType: "PassFail";
    GradeSchemeUrl?: APIURL; // Not on input actions
}

interface SelectBoxGradeObject extends BaseGradeObject {
    MaxPoints: number;
    IsBonus: boolean;
    ExcludeFromFinalGradeCalculation: boolean;
    GradeSchemeId: D2LID; // Cannot be null on input actions
    GradeType: "SelectBox";
    GradeSchemeUrl?: APIURL; // Not on input actions
}

interface TextGradeObject extends BaseGradeObject {
    GradeType: "Text";
}

type GradeObject =
    | NumericGradeObject
    | PassFailGradeObject
    | SelectBoxGradeObject
    | TextGradeObject;

interface GradeObjectCategoryData {
    Name: string;
    ShortName: string;
    CanExceedMax: boolean;
    ExcludeFromFinalGrade: boolean;
    StartDate: UTCDateTime | null;
    EndDate: UTCDateTime | null;
    Weight: number | null;
    MaxPoints: number | null;
    AutoPoints: boolean | null;
    WeightDistributionType: number | null;
    NumberOfHighestToDrop: number | null;
    NumberOfLowestToDrop: number | null;
}

interface BaseGradeObjectCategory {
    Id: D2LID;
    Grades: GradeObject[];
}

type GradeObjectCategory = BaseGradeObjectCategory & GradeObjectCategoryData;

interface GradeSchemeRange {
    PercentStart: number;
    Symbol: string;
    AssignedValue: number | null;
    Colour: string;
}

interface GradeScheme {
    Id: D2LID;
    Name: string;
    ShortName: string;
    Ranges: GradeSchemeRange[];
}

// Base Grade Value (shared properties)
interface BaseGradeValue {
    DisplayedGrade: string;
    GradeObjectIdentifier: string; // D2LID as string
    GradeObjectName: string;
    GradeObjectType: GRADEOBJ_T;
    GradeObjectTypeName: string | null;
    Comments: RichText;
    PrivateComments: RichText;
    LastModified: UTCDateTime | null;
    LastModifiedBy: string | null; // D2LID as string
    ReleasedDate: UTCDateTime | null;
}

interface ComputableGradeValue extends BaseGradeValue {
    PointsNumerator: number | null;
    PointsDenominator: number | null;
    WeightedDenominator: number | null;
    WeightedNumerator: number | null;
}

// Union type for grade values
type GradeValue = BaseGradeValue | ComputableGradeValue;

// Type guards to distinguish between different grade object types
export function isGradeObject(grade: any): grade is GradeObject {
    return "CategoryId" in grade && "GradeType" in grade;
}

export function isNumericGradeObject(grade: GradeObject): grade is NumericGradeObject {
    return grade.GradeType === "Numeric";
}

export function isPassFailGradeObject(grade: GradeObject): grade is PassFailGradeObject {
    return grade.GradeType === "PassFail";
}

export function isSelectBoxGradeObject(grade: GradeObject): grade is SelectBoxGradeObject {
    return grade.GradeType === "SelectBox";
}

export function isTextGradeObject(grade: GradeObject): grade is TextGradeObject {
    return grade.GradeType === "Text";
}

// Type guard to distinguish between base and computable grade values
export function isComputableGradeValue(gradeValue: GradeValue): gradeValue is ComputableGradeValue {
    return "PointsNumerator" in gradeValue;
}

// Export all types
export type {
    AssociatedTool,
    BaseGradeObject,
    NumericGradeObject,
    PassFailGradeObject,
    SelectBoxGradeObject,
    TextGradeObject,
    GradeObject,
    GradeObjectCategoryData,
    BaseGradeObjectCategory,
    GradeObjectCategory,
    GradeSchemeRange,
    GradeScheme,
    BaseGradeValue,
    ComputableGradeValue,
    GradeValue,
};
