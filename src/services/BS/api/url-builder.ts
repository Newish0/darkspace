import { productVersionChecker } from "./versions";

export class UrlBuilder {
    private base: string;
    private leVersion: string;

    private static TEMPLATES = {
        GRADE_CATEGORIES: "{{BASE}}/d2l/api/le/{{LE_VERSION}}/{{ORG_UNIT_ID}}/grades/categories/",
        GRADES: "{{BASE}}/d2l/api/le/{{LE_VERSION}}/{{ORG_UNIT_ID}}/grades/",
        GRADE: "{{BASE}}/d2l/api/le/{{LE_VERSION}}/{{ORG_UNIT_ID}}/grades/{{GRADE_ID}}",
        MY_GRADE_VALUE:
            "{{BASE}}/d2l/api/le/{{LE_VERSION}}/{{ORG_UNIT_ID}}/grades/{{GRADE_ID}}/values/myGradeValue",
        MY_FINAL_GRADE_VALUE:
            "{{BASE}}/d2l/api/le/{{LE_VERSION}}/{{ORG_UNIT_ID}}/grades/final/values/myGradeValue",
    };

    constructor(base: string, leVersion: string) {
        this.base = base;
        this.leVersion = leVersion;
    }

    public buildGradeCategoriesUrl(orgUnitId: string) {
        return UrlBuilder.TEMPLATES.GRADE_CATEGORIES.replace("{{BASE}}", this.base)
            .replace("{{LE_VERSION}}", this.leVersion)
            .replace("{{ORG_UNIT_ID}}", orgUnitId);
    }

    public buildGradesUrl(orgUnitId: string) {
        return UrlBuilder.TEMPLATES.GRADES.replace("{{BASE}}", this.base)
            .replace("{{LE_VERSION}}", this.leVersion)
            .replace("{{ORG_UNIT_ID}}", orgUnitId);
    }

    public buildGradeUrl(orgUnitId: string, gradeId: string) {
        return UrlBuilder.TEMPLATES.GRADE.replace("{{BASE}}", this.base)
            .replace("{{LE_VERSION}}", this.leVersion)
            .replace("{{ORG_UNIT_ID}}", orgUnitId)
            .replace("{{GRADE_ID}}", gradeId);
    }

    public buildMyGradeValueUrl(orgUnitId: string, gradeId: string) {
        return UrlBuilder.TEMPLATES.MY_GRADE_VALUE.replace("{{BASE}}", this.base)
            .replace("{{LE_VERSION}}", this.leVersion)
            .replace("{{ORG_UNIT_ID}}", orgUnitId)
            .replace("{{GRADE_ID}}", gradeId);
    }

    public buildMyFinalGradeValueUrl(orgUnitId: string) {
        return UrlBuilder.TEMPLATES.MY_FINAL_GRADE_VALUE.replace("{{BASE}}", this.base)
            .replace("{{LE_VERSION}}", this.leVersion)
            .replace("{{ORG_UNIT_ID}}", orgUnitId);
    }
}

const latestLeVersion = await productVersionChecker.getLatestLeVersion();
export const urlBuilder = new UrlBuilder(window.location.origin, latestLeVersion);
