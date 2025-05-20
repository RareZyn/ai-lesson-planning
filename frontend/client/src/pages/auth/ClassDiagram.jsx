import React from "react";

const ClassDiagram = () => {
  return (
    <svg
      width="100%"
      height="1800"
      viewBox="0 0 1200 1800"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* User and Authentication Classes */}
      <rect
        x="50"
        y="50"
        width="240"
        height="130"
        fill="#e6f7ff"
        stroke="#1890ff"
        strokeWidth="2"
      />
      <text x="170" y="80" textAnchor="middle" fontWeight="bold">
        User
      </text>
      <line x1="50" y1="90" x2="290" y2="90" stroke="#1890ff" strokeWidth="2" />
      <text x="60" y="115">
        - userId: String
      </text>
      <text x="60" y="135">
        - name: String
      </text>
      <text x="60" y="155">
        - email: String
      </text>
      <line
        x1="50"
        y1="165"
        x2="290"
        y2="165"
        stroke="#1890ff"
        strokeWidth="2"
      />
      <text x="60" y="185">
        + login(): Boolean
      </text>

      {/* School and Class Management Classes */}
      <rect
        x="50"
        y="250"
        width="240"
        height="150"
        fill="#e6f7ff"
        stroke="#1890ff"
        strokeWidth="2"
      />
      <text x="170" y="280" textAnchor="middle" fontWeight="bold">
        Class
      </text>
      <line
        x1="50"
        y1="290"
        x2="290"
        y2="290"
        stroke="#1890ff"
        strokeWidth="2"
      />
      <text x="60" y="315">
        - classId: String
      </text>
      <text x="60" y="335">
        - className: String
      </text>
      <text x="60" y="355">
        - teacherId: String
      </text>
      <text x="60" y="375">
        - students: List&lt;Student&gt;
      </text>
      <line
        x1="50"
        y1="385"
        x2="290"
        y2="385"
        stroke="#1890ff"
        strokeWidth="2"
      />
      <text x="60" y="405">
        + getClassPerformance(): Analytics
      </text>

      <rect
        x="350"
        y="250"
        width="240"
        height="130"
        fill="#e6f7ff"
        stroke="#1890ff"
        strokeWidth="2"
      />
      <text x="470" y="280" textAnchor="middle" fontWeight="bold">
        Student
      </text>
      <line
        x1="350"
        y1="290"
        x2="590"
        y2="290"
        stroke="#1890ff"
        strokeWidth="2"
      />
      <text x="360" y="315">
        - studentId: String
      </text>
      <text x="360" y="335">
        - name: String
      </text>
      <text x="360" y="355">
        - classId: String
      </text>
      <line
        x1="350"
        y1="365"
        x2="590"
        y2="365"
        stroke="#1890ff"
        strokeWidth="2"
      />
      <text x="360" y="385">
        + getStudentPerformance(): Analytics
      </text>

      {/* Assessment Module Classes */}
      <rect
        x="650"
        y="50"
        width="240"
        height="180"
        fill="#f9f0ff"
        stroke="#722ed1"
        strokeWidth="2"
      />
      <text x="770" y="80" textAnchor="middle" fontWeight="bold">
        AssessmentGenerator
      </text>
      <line
        x1="650"
        y1="90"
        x2="890"
        y2="90"
        stroke="#722ed1"
        strokeWidth="2"
      />
      <text x="660" y="115">
        - subject: String
      </text>
      <text x="660" y="135">
        - level: String
      </text>
      <text x="660" y="155">
        - bloomsTaxonomyLevel: String
      </text>
      <text x="660" y="175">
        - topic: String
      </text>
      <line
        x1="650"
        y1="185"
        x2="890"
        y2="185"
        stroke="#722ed1"
        strokeWidth="2"
      />
      <text x="660" y="205">
        + generateAssessment(): Assessment
      </text>
      <text x="660" y="225">
        + generateRubric(): Rubric
      </text>

      <rect
        x="650"
        y="250"
        width="240"
        height="180"
        fill="#f9f0ff"
        stroke="#722ed1"
        strokeWidth="2"
      />
      <text x="770" y="280" textAnchor="middle" fontWeight="bold">
        Assessment
      </text>
      <line
        x1="650"
        y1="290"
        x2="890"
        y2="290"
        stroke="#722ed1"
        strokeWidth="2"
      />
      <text x="660" y="315">
        - assessmentId: String
      </text>
      <text x="660" y="335">
        - title: String
      </text>
      <text x="660" y="355">
        - questions: List&lt;Question&gt;
      </text>
      <text x="660" y="375">
        - rubric: Rubric
      </text>
      <line
        x1="650"
        y1="385"
        x2="890"
        y2="385"
        stroke="#722ed1"
        strokeWidth="2"
      />
      <text x="660" y="405">
        + downloadAssessment(): File
      </text>
      <text x="660" y="425">
        + saveOffline(): Boolean
      </text>

      <rect
        x="950"
        y="250"
        width="240"
        height="170"
        fill="#f9f0ff"
        stroke="#722ed1"
        strokeWidth="2"
      />
      <text x="1070" y="280" textAnchor="middle" fontWeight="bold">
        Question
      </text>
      <line
        x1="950"
        y1="290"
        x2="1190"
        y2="290"
        stroke="#722ed1"
        strokeWidth="2"
      />
      <text x="960" y="315">
        - questionId: String
      </text>
      <text x="960" y="335">
        - text: String
      </text>
      <text x="960" y="355">
        - bloomsLevel: String
      </text>
      <text x="960" y="375">
        - correctAnswer: String
      </text>
      <line
        x1="950"
        y1="385"
        x2="1190"
        y2="385"
        stroke="#722ed1"
        strokeWidth="2"
      />
      <text x="960" y="405">
        + getSchema(): String
      </text>
      <text x="960" y="425">
        + getPoints(): Integer
      </text>

      <rect
        x="950"
        y="50"
        width="240"
        height="170"
        fill="#f9f0ff"
        stroke="#722ed1"
        strokeWidth="2"
      />
      <text x="1070" y="80" textAnchor="middle" fontWeight="bold">
        Rubric
      </text>
      <line
        x1="950"
        y1="90"
        x2="1190"
        y2="90"
        stroke="#722ed1"
        strokeWidth="2"
      />
      <text x="960" y="115">
        - rubricId: String
      </text>
      <text x="960" y="135">
        - criteria: List&lt;Criteria&gt;
      </text>
      <text x="960" y="155">
        - totalPoints: Integer
      </text>
      <text x="960" y="175">
        - assessmentId: String
      </text>
      <line
        x1="950"
        y1="185"
        x2="1190"
        y2="185"
        stroke="#722ed1"
        strokeWidth="2"
      />
      <text x="960" y="205">
        + editRubric(Criteria): Rubric
      </text>
      <text x="960" y="225">
        + downloadRubric(): File
      </text>

      {/* Answer Recognition Module Classes */}
      <rect
        x="350"
        y="450"
        width="240"
        height="180"
        fill="#e6fffb"
        stroke="#13c2c2"
        strokeWidth="2"
      />
      <text x="470" y="480" textAnchor="middle" fontWeight="bold">
        AnswerRecognition
      </text>
      <line
        x1="350"
        y1="490"
        x2="590"
        y2="490"
        stroke="#13c2c2"
        strokeWidth="2"
      />
      <text x="360" y="515">
        - imageFile: File
      </text>
      <text x="360" y="535">
        - confidenceThreshold: Float
      </text>
      <text x="360" y="555">
        - questionId: String
      </text>
      <text x="360" y="575">
        - studentId: String
      </text>
      <line
        x1="350"
        y1="585"
        x2="590"
        y2="585"
        stroke="#13c2c2"
        strokeWidth="2"
      />
      <text x="360" y="605">
        + extractText(): String
      </text>
      <text x="360" y="625">
        + getConfidenceScore(): Float
      </text>

      <rect
        x="650"
        y="450"
        width="240"
        height="170"
        fill="#e6fffb"
        stroke="#13c2c2"
        strokeWidth="2"
      />
      <text x="770" y="480" textAnchor="middle" fontWeight="bold">
        AutoGrader
      </text>
      <line
        x1="650"
        y1="490"
        x2="890"
        y2="490"
        stroke="#13c2c2"
        strokeWidth="2"
      />
      <text x="660" y="515">
        - extractedText: String
      </text>
      <text x="660" y="535">
        - correctAnswer: String
      </text>
      <text x="660" y="555">
        - rubric: Rubric
      </text>
      <line
        x1="650"
        y1="565"
        x2="890"
        y2="565"
        stroke="#13c2c2"
        strokeWidth="2"
      />
      <text x="660" y="585">
        + compareAnswer(): Float
      </text>
      <text x="660" y="605">
        + generateScore(): StudentScore
      </text>
      <text x="660" y="625">
        + editScore(Float): StudentScore
      </text>

      <rect
        x="950"
        y="450"
        width="240"
        height="150"
        fill="#e6fffb"
        stroke="#13c2c2"
        strokeWidth="2"
      />
      <text x="1070" y="480" textAnchor="middle" fontWeight="bold">
        StudentScore
      </text>
      <line
        x1="950"
        y1="490"
        x2="1190"
        y2="490"
        stroke="#13c2c2"
        strokeWidth="2"
      />
      <text x="960" y="515">
        - scoreId: String
      </text>
      <text x="960" y="535">
        - studentId: String
      </text>
      <text x="960" y="555">
        - assessmentId: String
      </text>
      <text x="960" y="575">
        - scores: Map&lt;QuestionId, Float&gt;
      </text>
      <line
        x1="950"
        y1="585"
        x2="1190"
        y2="585"
        stroke="#13c2c2"
        strokeWidth="2"
      />
      <text x="960" y="605">
        + getTotalScore(): Float
      </text>

      {/* Dashboard Module Classes */}
      <rect
        x="50"
        y="650"
        width="240"
        height="180"
        fill="#f6ffed"
        stroke="#52c41a"
        strokeWidth="2"
      />
      <text x="170" y="680" textAnchor="middle" fontWeight="bold">
        Dashboard
      </text>
      <line
        x1="50"
        y1="690"
        x2="290"
        y2="690"
        stroke="#52c41a"
        strokeWidth="2"
      />
      <text x="60" y="715">
        - teacherId: String
      </text>
      <text x="60" y="735">
        - classId: String
      </text>
      <text x="60" y="755">
        - timeRange: DateRange
      </text>
      <text x="60" y="775">
        - filters: Map&lt;String, String&gt;
      </text>
      <line
        x1="50"
        y1="785"
        x2="290"
        y2="785"
        stroke="#52c41a"
        strokeWidth="2"
      />
      <text x="60" y="805">
        + generateCharts(): List&lt;Chart&gt;
      </text>
      <text x="60" y="825">
        + generateReport(): Report
      </text>

      <rect
        x="350"
        y="650"
        width="240"
        height="150"
        fill="#f6ffed"
        stroke="#52c41a"
        strokeWidth="2"
      />
      <text x="470" y="680" textAnchor="middle" fontWeight="bold">
        Analytics
      </text>
      <line
        x1="350"
        y1="690"
        x2="590"
        y2="690"
        stroke="#52c41a"
        strokeWidth="2"
      />
      <text x="360" y="715">
        - metrics: Map&lt;String, Float&gt;
      </text>
      <text x="360" y="735">
        - progress: List&lt;DataPoint&gt;
      </text>
      <text x="360" y="755">
        - masteryLevels: Map&lt;Topic, Float&gt;
      </text>
      <line
        x1="350"
        y1="765"
        x2="590"
        y2="765"
        stroke="#52c41a"
        strokeWidth="2"
      />
      <text x="360" y="785">
        + calculateClassAverage(): Float
      </text>
      <text x="360" y="805">
        + getTopicsMastered(): List&lt;Topic&gt;
      </text>

      <rect
        x="650"
        y="650"
        width="240"
        height="150"
        fill="#f6ffed"
        stroke="#52c41a"
        strokeWidth="2"
      />
      <text x="770" y="680" textAnchor="middle" fontWeight="bold">
        Report
      </text>
      <line
        x1="650"
        y1="690"
        x2="890"
        y2="690"
        stroke="#52c41a"
        strokeWidth="2"
      />
      <text x="660" y="715">
        - reportId: String
      </text>
      <text x="660" y="735">
        - data: Analytics
      </text>
      <text x="660" y="755">
        - format: String
      </text>
      <line
        x1="650"
        y1="765"
        x2="890"
        y2="765"
        stroke="#52c41a"
        strokeWidth="2"
      />
      <text x="660" y="785">
        + downloadReport(): File
      </text>
      <text x="660" y="805">
        + filterReport(Filters): Report
      </text>

      {/* Lesson Sharing Module Classes */}
      <rect
        x="50"
        y="850"
        width="240"
        height="180"
        fill="#fff2e8"
        stroke="#fa8c16"
        strokeWidth="2"
      />
      <text x="170" y="880" textAnchor="middle" fontWeight="bold">
        LessonSharingHub
      </text>
      <line
        x1="50"
        y1="890"
        x2="290"
        y2="890"
        stroke="#fa8c16"
        strokeWidth="2"
      />
      <text x="60" y="915">
        - searchFilters: Map&lt;String, String&gt;
      </text>
      <text x="60" y="935">
        - sortBy: String
      </text>
      <text x="60" y="955">
        - currentPage: Integer
      </text>
      <line
        x1="50"
        y1="965"
        x2="290"
        y2="965"
        stroke="#fa8c16"
        strokeWidth="2"
      />
      <text x="60" y="985">
        + searchPlans(String): List&lt;LessonPlan&gt;
      </text>
      <text x="60" y="1005">
        + filterPlans(Filters): List&lt;LessonPlan&gt;
      </text>
      <text x="60" y="1025">
        + browseTrendingPlans(): List&lt;LessonPlan&gt;
      </text>

      <rect
        x="350"
        y="850"
        width="240"
        height="180"
        fill="#fff2e8"
        stroke="#fa8c16"
        strokeWidth="2"
      />
      <text x="470" y="880" textAnchor="middle" fontWeight="bold">
        LessonPlan
      </text>
      <line
        x1="350"
        y1="890"
        x2="590"
        y2="890"
        stroke="#fa8c16"
        strokeWidth="2"
      />
      <text x="360" y="915">
        - planId: String
      </text>
      <text x="360" y="935">
        - title: String
      </text>
      <text x="360" y="955">
        - authorId: String
      </text>
      <text x="360" y="975">
        - tags: List&lt;String&gt;
      </text>
      <text x="360" y="995">
        - content: String
      </text>
      <line
        x1="350"
        y1="1005"
        x2="590"
        y2="1005"
        stroke="#fa8c16"
        strokeWidth="2"
      />
      <text x="360" y="1025">
        + saveToCllection(): Boolean
      </text>
      <text x="360" y="1045">
        + download(): File
      </text>

      <rect
        x="650"
        y="850"
        width="240"
        height="170"
        fill="#fff2e8"
        stroke="#fa8c16"
        strokeWidth="2"
      />
      <text x="770" y="880" textAnchor="middle" fontWeight="bold">
        LessonInteraction
      </text>
      <line
        x1="650"
        y1="890"
        x2="890"
        y2="890"
        stroke="#fa8c16"
        strokeWidth="2"
      />
      <text x="660" y="915">
        - planId: String
      </text>
      <text x="660" y="935">
        - userId: String
      </text>
      <text x="660" y="955">
        - interactionType: String
      </text>
      <text x="660" y="975">
        - content: String
      </text>
      <line
        x1="650"
        y1="985"
        x2="890"
        y2="985"
        stroke="#fa8c16"
        strokeWidth="2"
      />
      <text x="660" y="1005">
        + like(): Boolean
      </text>
      <text x="660" y="1025">
        + comment(String): Comment
      </text>
      <text x="660" y="1045">
        + saveToCollection(): Boolean
      </text>

      {/* Offline Support Module Classes */}
      <rect
        x="50"
        y="1050"
        width="240"
        height="170"
        fill="#f9f0ff"
        stroke="#722ed1"
        strokeWidth="2"
      />
      <text x="170" y="1080" textAnchor="middle" fontWeight="bold">
        OfflineManager
      </text>
      <line
        x1="50"
        y1="1090"
        x2="290"
        y2="1090"
        stroke="#722ed1"
        strokeWidth="2"
      />
      <text x="60" y="1115">
        - deviceId: String
      </text>
      <text x="60" y="1135">
        - lastSyncTimestamp: DateTime
      </text>
      <text x="60" y="1155">
        - pendingUploads: Queue&lt;Action&gt;
      </text>
      <line
        x1="50"
        y1="1165"
        x2="290"
        y2="1165"
        stroke="#722ed1"
        strokeWidth="2"
      />
      <text x="60" y="1185">
        + syncData(): Boolean
      </text>
      <text x="60" y="1205">
        + downloadForOffline(Content): Boolean
      </text>
      <text x="60" y="1225">
        + checkConnection(): Boolean
      </text>

      <rect
        x="350"
        y="1050"
        width="240"
        height="150"
        fill="#f9f0ff"
        stroke="#722ed1"
        strokeWidth="2"
      />
      <text x="470" y="1080" textAnchor="middle" fontWeight="bold">
        LocalStorage
      </text>
      <line
        x1="350"
        y1="1090"
        x2="590"
        y2="1090"
        stroke="#722ed1"
        strokeWidth="2"
      />
      <text x="360" y="1115">
        - storageCapacity: Integer
      </text>
      <text x="360" y="1135">
        - availableSpace: Integer
      </text>
      <line
        x1="350"
        y1="1145"
        x2="590"
        y2="1145"
        stroke="#722ed1"
        strokeWidth="2"
      />
      <text x="360" y="1165">
        + storeData(Key, Value): Boolean
      </text>
      <text x="360" y="1185">
        + retrieveData(Key): Value
      </text>
      <text x="360" y="1205">
        + clearStorage(): Boolean
      </text>

      {/* Associations */}
      {/* User to Class */}
      <line
        x1="170"
        y1="180"
        x2="170"
        y2="250"
        stroke="#000"
        strokeWidth="1"
        strokeDasharray="5,5"
      />
      <polygon points="165,240 170,250 175,240" fill="#000" />
      <text x="180" y="220" fontSize="12">
        teaches
      </text>
      <text x="145" y="220" fontSize="12">
        1
      </text>
      <text x="145" y="245" fontSize="12">
        *
      </text>

      {/* Class to Student */}
      <line x1="290" y1="325" x2="350" y2="325" stroke="#000" strokeWidth="1" />
      <polygon points="340,320 350,325 340,330" fill="#000" />
      <text x="310" y="315" fontSize="12">
        contains
      </text>
      <text x="295" y="340" fontSize="12">
        1
      </text>
      <text x="340" y="340" fontSize="12">
        *
      </text>

      {/* AssessmentGenerator to Assessment */}
      <line x1="770" y1="230" x2="770" y2="250" stroke="#000" strokeWidth="1" />
      <polygon points="765,240 770,250 775,240" fill="#000" />
      <text x="780" y="240" fontSize="12">
        creates
      </text>
      <text x="760" y="240" fontSize="12">
        1
      </text>
      <text x="760" y="245" fontSize="12">
        *
      </text>

      {/* Assessment to Question */}
      <line x1="890" y1="325" x2="950" y2="325" stroke="#000" strokeWidth="1" />
      <polygon points="940,320 950,325 940,330" fill="#000" />
      <text x="910" y="315" fontSize="12">
        contains
      </text>
      <text x="895" y="340" fontSize="12">
        1
      </text>
      <text x="940" y="340" fontSize="12">
        *
      </text>

      {/* Assessment to Rubric */}
      <line x1="890" y1="250" x2="950" y2="150" stroke="#000" strokeWidth="1" />
      <polygon points="942,158 950,150 938,146" fill="#000" />
      <text x="910" y="200" fontSize="12">
        uses
      </text>
      <text x="895" y="270" fontSize="12">
        1
      </text>
      <text x="945" y="170" fontSize="12">
        1
      </text>

      {/* AnswerRecognition to AutoGrader */}
      <line x1="590" y1="525" x2="650" y2="525" stroke="#000" strokeWidth="1" />
      <polygon points="640,520 650,525 640,530" fill="#000" />
      <text x="610" y="515" fontSize="12">
        provides text to
      </text>
      <text x="595" y="540" fontSize="12">
        1
      </text>
      <text x="640" y="540" fontSize="12">
        1
      </text>

      {/* AutoGrader to StudentScore */}
      <line x1="890" y1="525" x2="950" y2="525" stroke="#000" strokeWidth="1" />
      <polygon points="940,520 950,525 940,530" fill="#000" />
      <text x="910" y="515" fontSize="12">
        creates
      </text>
      <text x="895" y="540" fontSize="12">
        1
      </text>
      <text x="940" y="540" fontSize="12">
        *
      </text>

      {/* Dashboard to Analytics */}
      <line x1="290" y1="725" x2="350" y2="725" stroke="#000" strokeWidth="1" />
      <polygon points="340,720 350,725 340,730" fill="#000" />
      <text x="310" y="715" fontSize="12">
        displays
      </text>
      <text x="295" y="740" fontSize="12">
        1
      </text>
      <text x="340" y="740" fontSize="12">
        *
      </text>

      {/* Dashboard to Report */}
      <line x1="290" y1="815" x2="650" y2="725" stroke="#000" strokeWidth="1" />
      <polygon points="640,730 650,725 638,720" fill="#000" />
      <text x="450" y="760" fontSize="12">
        generates
      </text>
      <text x="310" y="800" fontSize="12">
        1
      </text>
      <text x="640" y="740" fontSize="12">
        *
      </text>

      {/* LessonSharingHub to LessonPlan */}
      <line x1="290" y1="925" x2="350" y2="925" stroke="#000" strokeWidth="1" />
      <polygon points="340,920 350,925 340,930" fill="#000" />
      <text x="310" y="915" fontSize="12">
        manages
      </text>
      <text x="295" y="940" fontSize="12">
        1
      </text>
      <text x="340" y="940" fontSize="12">
        *
      </text>

      {/* LessonPlan to LessonInteraction */}
      <line x1="590" y1="925" x2="650" y2="925" stroke="#000" strokeWidth="1" />
      <polygon points="640,920 650,925 640,930" fill="#000" />
      <text x="610" y="915" fontSize="12">
        has
      </text>
      <text x="595" y="940" fontSize="12">
        1
      </text>
      <text x="640" y="940" fontSize="12">
        *
      </text>

      {/* OfflineManager to LocalStorage */}
      <line
        x1="290"
        y1="1125"
        x2="350"
        y2="1125"
        stroke="#000"
        strokeWidth="1"
      />
      <polygon points="340,1120 350,1125 340,1130" fill="#000" />
      <text x="310" y="1115" fontSize="12">
        uses
      </text>
      <text x="295" y="1140" fontSize="12">
        1
      </text>
      <text x="340" y="1140" fontSize="12">
        1
      </text>

      {/* Connect Assessment with AnswerRecognition */}
      <line
        x1="770"
        y1="430"
        x2="470"
        y2="450"
        stroke="#000"
        strokeWidth="1"
        strokeDasharray="5,5"
      />
      <polygon points="480,445 470,450 480,455" fill="#000" />
      <text x="600" y="425" fontSize="12">
        analyzes answers for
      </text>

      {/* Connect Student with StudentScore */}
      <line
        x1="470"
        y1="380"
        x2="1050"
        y2="450"
        stroke="#000"
        strokeWidth="1"
        strokeDasharray="5,5"
      />
      <polygon points="1040,440 1050,450 1045,438" fill="#000" />
      <text x="700" y="405" fontSize="12">
        receives
      </text>

      {/* Connect Class to Dashboard */}
      <line
        x1="150"
        y1="400"
        x2="150"
        y2="650"
        stroke="#000"
        strokeWidth="1"
        strokeDasharray="5,5"
      />
      <polygon points="145,640 150,650 155,640" fill="#000" />
      <text x="160" y="525" fontSize="12">
        analyzed by
      </text>

      {/* User to LessonPlan */}
      <line x1="50" y1="150" x2="30" y2="150" stroke="#000" strokeWidth="1" />
      <line x1="30" y1="150" x2="30" y2="925" stroke="#000" strokeWidth="1" />
      <line x1="30" y1="925" x2="350" y2="925" stroke="#000" strokeWidth="1" />
      <polygon points="340,920 350,925 340,930" fill="#000" />
      <text x="100" y="900" fontSize="12">
        creates
      </text>
      <text x="40" y="150" fontSize="12">
        1
      </text>
      <text x="340" y="910" fontSize="12">
        *
      </text>

      {/* Connect Assessment to OfflineManager */}
      <line x1="650" y1="430" x2="630" y2="430" stroke="#000" strokeWidth="1" />
      <line
        x1="630"
        y1="430"
        x2="630"
        y2="1100"
        stroke="#000"
        strokeWidth="1"
      />
      <line
        x1="630"
        y1="1100"
        x2="290"
        y2="1100"
        stroke="#000"
        strokeWidth="1"
      />
      <polygon points="300,1095 290,1100 300,1105" fill="#000" />
      <text x="450" y="1080" fontSize="12">
        downloads for offline
      </text>
    </svg>
  );
};

export default ClassDiagram;
